import { ContainerModule } from "inversify";
import { configureCommand, TYPES } from "sprotty";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { LabelingProcessCommand } from "./labelingProcessCommand.ts";
import { EDITOR_TYPES } from "../editorTypes.ts";
import { OutputPortAssignmentCommand } from "./outputPortAssignmentCommand.ts";
import { ClickToAssignMouseListener } from "./ClickToAssignMouseListener.ts";

export const labelingProcessModule = new ContainerModule((bind, _, isBound) => {
    bind(LabelingProcessUi).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LabelingProcessUi);
    bind(EDITOR_TYPES.DefaultUIElement).to(LabelingProcessUi);

    bind(TYPES.MouseListener).to(ClickToAssignMouseListener).inSingletonScope();

    configureCommand({bind, isBound}, LabelingProcessCommand)
    configureCommand({bind, isBound}, OutputPortAssignmentCommand);
})