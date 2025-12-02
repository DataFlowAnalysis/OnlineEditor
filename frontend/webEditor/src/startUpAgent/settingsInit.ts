import { IStartUpAgent } from "./StartUpAgent";
import { inject, multiInject } from "inversify";
import { linkReadOnly } from "../settings/initialize";
import { EditorModeController } from "../settings/editorMode";
import { SETTINGS, HideEdgeNames, SimplifyNodeNames } from "../settings/Settings";
import { registerThemeSwitch, ThemeManager, ThemeSwitchable } from "../settings/Theme";

export class SettingsInitStartUpAgent implements IStartUpAgent {
    constructor(@inject(SETTINGS.Theme) private readonly themeManager: ThemeManager, @inject(SETTINGS.HideEdgeNames) private readonly hideEdgeNames: HideEdgeNames,
        @inject(SETTINGS.SimplifyNodeNames) private readonly simplifyNodeNames: SimplifyNodeNames,
    @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController, @multiInject(ThemeSwitchable) private readonly switchables: ThemeSwitchable[]) {}

    run(): void {
      linkReadOnly(this.editorModeController, this.simplifyNodeNames, this.hideEdgeNames);
      registerThemeSwitch(this.themeManager, this.switchables)
    }

}