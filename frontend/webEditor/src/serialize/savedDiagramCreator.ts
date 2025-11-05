import { Command, CommandExecutionContext } from "sprotty";
import { CURRENT_VERSION, SavedDiagram } from "./SavedDiagram";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { EditorModeController } from "../editorMode/EditorModeController";

export abstract class SavedDiagramCreatorCommand extends Command {

  constructor(
    private readonly labelTypeRegistry: LabelTypeRegistry,
    private readonly editorModeController: EditorModeController
  ) {
    super()
  }

  protected createSavedDiagram(context: CommandExecutionContext): SavedDiagram {
    const schema = context.modelFactory.createSchema(context.root);

    return {
      model: schema,
      labelTypes: this.labelTypeRegistry.getLabelTypes(),
      // TODO
      constraints: [],
      mode: this.editorModeController.getCurrentMode(),
      version: CURRENT_VERSION
    }
  }

}