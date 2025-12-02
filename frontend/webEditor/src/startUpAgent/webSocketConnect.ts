import { IStartUpAgent } from "./StartUpAgent";
import { inject } from "inversify";
import { DfdWebSocket } from "../webSocket/webSocket";

export class WebSocketConnectStartUpAgent implements IStartUpAgent {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(@inject(DfdWebSocket) _: DfdWebSocket) {}

    run(): void {}
}
