import { ContainerModule } from "inversify";
import { LabelTypeRegistry } from "./LabelTypeRegistry";
import { LabelTypeEditorUi } from "./LabelTypeEditorUi";
import { configureCommand, TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";
import { LabelAssignmentCommand } from "./assignmentCommand";
import { DfdLabelMouseDropListener } from "./dragAndDrop";
import { ReplaceCommand } from "./renameCommand";

export const labelModule = new ContainerModule((bind, _, isBound) => {
    bind(LabelTypeRegistry).toSelf().inSingletonScope();

    bind(LabelTypeEditorUi).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LabelTypeEditorUi);
    bind(EDITOR_TYPES.DefaultUIElement).to(LabelTypeEditorUi);

    configureCommand({ bind, isBound }, LabelAssignmentCommand);
    configureCommand({ bind, isBound }, ReplaceCommand);
    bind(TYPES.MouseListener).to(DfdLabelMouseDropListener);
});
