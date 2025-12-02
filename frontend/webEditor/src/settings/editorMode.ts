import { SettingsValue } from "./SettingsValue";

export type EditorMode = "edit" | "view";

export class EditorModeController extends SettingsValue<EditorMode> {
    constructor() {
        super("edit");
    }

    setDefault(): void {
        this.set("edit");
    }

    isReadOnly(): boolean {
        return this.get() !== "edit";
    }
}
