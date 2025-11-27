import { Action } from "sprotty-protocol";
import { FileData, LoadJsonCommand } from "./loadJson";
import { chooseFile } from "./fileChooser";
import { inject } from "inversify";
import { TYPES, ILogger, ActionDispatcher } from "sprotty";
import { EditorModeController } from "../settings/editorMode";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SavedDiagram } from "./SavedDiagram";
import { FileName } from "../fileName/fileName";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";

export namespace LoadJsonFileAction {
    export const KIND = "loadJsonFile";

    export function create(): Action {
        return { kind: KIND };
    }
}


export class LoadJsonFileCommand extends LoadJsonCommand {
  static readonly KIND = LoadJsonFileAction.KIND;

  constructor(
    @inject(TYPES.Action) _: Action,
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
    @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
    @inject(SETTINGS.Mode) editorModeController: EditorModeController,
    @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
    @inject(FileName) fileName: FileName,
) {
    super(logger, labelTypeRegistry, constraintRegistry, editorModeController, actionDispatcher, fileName);
}

  protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
    const file = await chooseFile(["application/json"])
    if (!file) {
      return undefined
    }

    this.fileName.setName(file.fileName)

    return {
      fileName: file.fileName,
      content: JSON.parse(file.content) as SavedDiagram
    }
  }

}