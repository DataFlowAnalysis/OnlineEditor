import { inject, injectable } from "inversify";
import { ILogger, TYPES } from "sprotty";

@injectable()
export class DfdWebSocket {

  private webSocket?: WebSocket
  private webSocketId = -1
  private lastRequest: {
    resolve?: (v: string) => void
    reject?: (e: Error) => void
  } = {}
  private static readonly WS_URL = "wss://websocket.dataflowanalysis.org/events/"

  constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {
    this.init()
  }

  private init() {
    this.webSocket = new WebSocket(DfdWebSocket.WS_URL)

    this.webSocket.onopen = () => {
      this.logger.log(this, "WebSocket connection established.")
    }

    this.webSocket.onclose = () => {
      this.logger.log(this, "WebSocket connection closed. Reconnecting...")
      this.reject(new Error("WebSocket connection closed"))
      this.init()
    }
    this.webSocket.onerror = () => {
      this.logger.log(this, "WebSocket error occurred.")
      this.reject(new Error("WebSocket error occurred"))
      this.init()
    }

    this.webSocket.onmessage = (event) => {
      const message = event.data as string
      this.logger.log(this, "WebSocket message received: " + message)
      
      if (message.startsWith("Error:")) {
        this.reject(new Error(message))
      }

      if (message.startsWith("ID assigned:")) {
        const parts = message.split(":")
        this.webSocketId = parseInt(parts[1].trim())
        this.logger.log(this, "WebSocket ID assigned: " + this.webSocketId)
        return
      }

      if (this.lastRequest.resolve) {
        this.lastRequest.resolve(message)
        this.lastRequest.resolve = undefined
        this.lastRequest.reject = undefined
      } else {
        this.logger.log(this, "No pending request to resolve.")
      }
    }
  }

  private reject(error: Error) {
    if (this.lastRequest.reject) {
      this.lastRequest.reject(error)
      this.lastRequest.resolve = undefined
      this.lastRequest.reject = undefined
    }
  }

  public async requestDiagram(message: string) {
    const result = await this.sendMessage(message)
    const name = result.split(":")[0]
    const diagramMessage = result.replace(name + ":", "")
    return {
      fileName: name,
      content: JSON.parse(diagramMessage)
    }
  }

  public sendMessage(message: string): Promise<string> {
    const result = new Promise<string>((resolve, reject) => {
      this.lastRequest.resolve = resolve
      this.lastRequest.reject = reject
    })
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      this.reject(new Error("WebSocket is not connected"))
      return result
    }

    this.webSocket.send(this.webSocketId + ":" + "TODO: DIAGRAM NAME" + ":" + message)
    return result
  }

}