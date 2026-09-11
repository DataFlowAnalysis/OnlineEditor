import { SettingsValue } from "./SettingsValue";

export type EditorMode = "edit" | "view" | "embed";

export class EditorModeController extends SettingsValue<EditorMode> {
    constructor() {
        super(new URLSearchParams(window.location.search).get("embed") === "true" ? "embed" : "edit");
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
