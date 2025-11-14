import { ContainerModule } from "inversify";
import { SettingsUI } from "./SettingsUi";
import { EDITOR_TYPES } from "../editorTypes";
import { SETTINGS } from "./Settings";
import { BoolSettingsValue } from "./SettingsValue";
import { TYPES } from "sprotty";
import { EditorModeController } from "./editorMode";

export const settingsModule = new ContainerModule((bind) => {
  bind(SettingsUI).toSelf().inSingletonScope();
  bind(EDITOR_TYPES.DefaultUIElement).toService(SettingsUI)
  bind(TYPES.IUIExtension).toService(SettingsUI);

  bind(SETTINGS.HideEdgeNames).to(BoolSettingsValue).inSingletonScope();
  bind(SETTINGS.SimplifyNodeNames).to(BoolSettingsValue).inSingletonScope();
  bind(SETTINGS.Mode).to(EditorModeController).inSingletonScope();
})