import { inject, injectable } from "inversify";
import { FileName } from "../fileName/fileName";

@injectable()
export class DfdApiClient {
    constructor(@inject(FileName) private readonly fileName: FileName) {}

    public async requestDiagram(message: string, action: string) {
        try {
            const result = await this.sendMessage(message, action);

            const name = result.split(":")[0];
            const diagramMessage = result.replace(name + ":", "");

            return {
                fileName: name,
                content: JSON.parse(diagramMessage),
            };
        } catch (error) {
            alert(error);
        }
    }

    public sendMessage(message: string, action: string): Promise<string> {
        const API_BASE_URL = "https://webeditor.t-hueller.de";

        return fetch(`${API_BASE_URL}/api/${action}`, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=UTF-8",
            },
            body: this.fileName.getName() + ":" + message,
        }).then((response) => {
            return response.text().then((responseText) => {
                if (!response.ok) {
                    throw new Error(responseText || `Request failed: ${response.status} ${response.statusText}`);
                }

                return responseText;
            });
        });
    }
}
