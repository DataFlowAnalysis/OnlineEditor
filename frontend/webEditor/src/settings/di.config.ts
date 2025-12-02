import { ContainerModule } from "inversify";
import { SettingsUI } from "./SettingsUi";
import { EDITOR_TYPES } from "../editorTypes";
import { SETTINGS } from "./Settings";
import { BoolSettingsValue } from "./SettingsValue";
import { configureCommand, TYPES } from "sprotty";
import { EditorModeController } from "./editorMode";
import { ThemeManager } from "./Theme";
import { ShownLabelsValue } from "./ShownLabels";
import { HideEdgeNamesCommand } from "./hideEdgeNames";
import { NodeNameRegistry, SimplifyNodeNamesCommand } from "./simplifyNodeNames";

export const settingsModule = new ContainerModule((bind, _, isBound) => {
  bind(SettingsUI).toSelf().inSingletonScope();
  bind(EDITOR_TYPES.DefaultUIElement).toService(SettingsUI)
  bind(TYPES.IUIExtension).toService(SettingsUI);

  bind(SETTINGS.Theme).to(ThemeManager).inSingletonScope()
  bind(SETTINGS.HideEdgeNames).to(BoolSettingsValue).inSingletonScope();
  bind(SETTINGS.SimplifyNodeNames).to(BoolSettingsValue).inSingletonScope();
  bind(SETTINGS.Mode).to(EditorModeController).inSingletonScope();
  bind(SETTINGS.ShownLabels).to(ShownLabelsValue).inSingletonScope()

  const context = {bind, isBound}
  configureCommand(context, HideEdgeNamesCommand)
  configureCommand(context, SimplifyNodeNamesCommand)
  bind(NodeNameRegistry).toSelf().inSingletonScope();
})