import { injectable } from "inversify";
import { SettingsValue } from "../settings/SettingsValue";

@injectable()
export class BackEndURL extends SettingsValue<string> {
    private static readonly DEFAULT_URL = "https://websocket.dataflowanalysis.org/api/";

    constructor() {
        super(BackEndURL.DEFAULT_URL);
    }

    set(newValue: string): void {
        super.set(newValue.endsWith("/") ? newValue : newValue + "/");
    }

    setDefault(): void {
        this.set(BackEndURL.DEFAULT_URL);
    }

    isDefault(): boolean {
        return this.get() === BackEndURL.DEFAULT_URL;
    }
}
