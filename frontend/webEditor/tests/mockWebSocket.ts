import { readFileSync } from "node:fs";

export class MockWebSocket {
    public static INSTANCE: MockWebSocket;

    url: string;
    readyState: number = WebSocket.CONNECTING;
    onopen?: () => void;
    onmessage?: (ev: MessageEvent) => void;
    onclose?: () => void;
    onerror?: () => void;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.INSTANCE = this;

        // simulate async connect
        setTimeout(() => {
            this.readyState = WebSocket.OPEN;
            this.onopen?.();
        }, 0);
    }

    send(data: string) {
        let response: string | undefined = undefined;
        if (data.startsWith("Json2DFD")) {
            const dd = readFileSync("./assets/dfd.datadictionary");
            const dfd = readFileSync("./assets/dfd.dataflowdiagram");
            response = `dfd:${dfd}${dd}`;
        }

        if (response) {
            setTimeout(() => {
                this._emitMessage(response);
            }, 0);
        }
    }

    close() {
        this.readyState = WebSocket.CLOSED;
        this.onclose?.();
    }

    /** helper for tests */
    _emitMessage(data: string) {
        this.onmessage?.(new MessageEvent("message", { data }));
    }
}
