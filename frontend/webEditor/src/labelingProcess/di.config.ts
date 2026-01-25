import { ContainerModule } from "inversify";
import { configureCommand, TYPES } from "sprotty";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { LabelingProcessCommand } from "./labelingProcessCommand.ts";
import { EDITOR_TYPES } from "../editorTypes.ts";
import { ThreatModelingLabelAssignmentToOutputPortCommand } from "./threatModelingLabelAssignmentToOutputPortCommand.ts";
import { LabelingProcessMouseListener } from "./labelingProcessMouseListener.ts";
import { ExcludesDialog } from "./excludesDialog.ts";
import { ThreatModelingLabelAssignmentCommand } from "./threatModelingLabelAssignmentCommand.ts";

export const labelingProcessModule = new ContainerModule((bind, _, isBound) => {
    bind(LabelingProcessUi).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LabelingProcessUi);
    bind(EDITOR_TYPES.DefaultUIElement).to(LabelingProcessUi);

    bind(ExcludesDialog).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ExcludesDialog);

    bind(TYPES.MouseListener).to(LabelingProcessMouseListener).inSingletonScope();

    configureCommand({bind, isBound}, LabelingProcessCommand)
    configureCommand({bind, isBound}, ThreatModelingLabelAssignmentCommand);
    configureCommand({bind, isBound}, ThreatModelingLabelAssignmentToOutputPortCommand);
})