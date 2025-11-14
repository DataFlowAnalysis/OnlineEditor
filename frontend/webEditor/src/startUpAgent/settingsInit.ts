import { IStartUpAgent } from "./StartUpAgent";
import { inject } from "inversify";
import { linkReadOnly } from "../settings/initialize";
import { EditorModeController } from "../settings/editorMode";
import { SETTINGS, HideEdgeNames, SimplifyNodeNames } from "../settings/Settings";

export class SettingsInitStartUpAgent implements IStartUpAgent {
    constructor(@inject(SETTINGS.HideEdgeNames) private readonly hideEdgeNames: HideEdgeNames,
        @inject(SETTINGS.SimplifyNodeNames) private readonly simplifyNodeNames: SimplifyNodeNames,
    @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController) {}

    run(): void {
      linkReadOnly(this.editorModeController, this.simplifyNodeNames, this.hideEdgeNames);
    }

}