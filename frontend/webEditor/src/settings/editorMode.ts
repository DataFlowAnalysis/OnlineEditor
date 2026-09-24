import { inject } from "inversify";
import { SettingsValue } from "./SettingsValue";
import { URLParameters } from "../urlParameters/URLParameters";

export type EditorMode = "edit" | "view" | "embed";

export class EditorModeController extends SettingsValue<EditorMode> {
    constructor(@inject(URLParameters) urlParameters: URLParameters) {
        super(urlParameters.getBoolean("embed") ? "embed" : "edit");
    }

    setDefault(): void {
        this.set("edit");
    }

    set(newValue: EditorMode): void {
        // changing it is not allowed in embed mode
        if (this.get() === "embed") {
            return;
        }
        super.set(newValue);
    }

    isReadOnly(): boolean {
        return this.get() !== "edit";
    }
}
