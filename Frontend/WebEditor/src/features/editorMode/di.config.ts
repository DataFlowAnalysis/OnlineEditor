import { ContainerModule } from "inversify";
import { TYPES, configureCommand } from "sprotty";
import { ChangeEditorModeCommand, EditorModeController } from "./editorModeController";
import { EditorModeSwitchUi } from "./modeSwitchUi";
import { EDITOR_TYPES } from "../../utils";

export const editorModeModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    bind(EditorModeController).toSelf().inSingletonScope();
    bind(EditorModeSwitchUi).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(EditorModeSwitchUi);
    bind(EDITOR_TYPES.DefaultUIElement).toService(EditorModeSwitchUi);

    configureCommand(context, ChangeEditorModeCommand);
});
