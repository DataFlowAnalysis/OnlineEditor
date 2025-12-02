import { Command, CommandExecutionContext } from "sprotty";
import { CURRENT_VERSION, SavedDiagram } from "./SavedDiagram";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { EditorModeController } from "../settings/editorMode";
import { ConstraintRegistry } from "../constraint/constraintRegistry";

export abstract class SavedDiagramCreatorCommand extends Command {
    constructor(
        private readonly labelTypeRegistry: LabelTypeRegistry,
        private readonly constraintRegistry: ConstraintRegistry,
        private readonly editorModeController: EditorModeController,
    ) {
        super();
    }

    protected createSavedDiagram(context: CommandExecutionContext): SavedDiagram {
        const schema = context.modelFactory.createSchema(context.root);

        return {
            model: schema,
            labelTypes: this.labelTypeRegistry.getLabelTypes(),
            constraints: this.constraintRegistry.getConstraintList(),
            mode: this.editorModeController.get(),
            version: CURRENT_VERSION,
        };
    }
}
