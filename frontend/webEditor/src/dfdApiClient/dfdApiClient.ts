import { inject, injectable } from "inversify";
import { FileName } from "../fileName/fileName";
import { BackEndURL } from "./backendUrl";

@injectable()
export class DfdApiClient {
    constructor(
        @inject(BackEndURL) private readonly backEndURL: BackEndURL,
        @inject(FileName) private readonly fileName: FileName,
    ) {}

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
            throw error;
        }
    }

    public sendMessage(message: string, action: string, name?: string): Promise<string> {
        const apiUrl = `${this.backEndURL.get()}${action}`;
        const fileName = name ?? this.fileName.getName();

        return fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=UTF-8",
            },
            body: fileName + ":" + message,
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
