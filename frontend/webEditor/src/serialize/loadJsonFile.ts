import { Action } from "sprotty-protocol";
import { FileData, LoadJsonCommand } from "./loadJson";
import { chooseFile } from "./fileChooser";
import { inject } from "inversify";
import { TYPES, ILogger, ActionDispatcher } from "sprotty";
import { EditorModeController } from "../editorMode/EditorModeController";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SavedDiagram } from "./SavedDiagram";

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
    @inject(EditorModeController) editorModeController: EditorModeController,
    @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
) {
    super(logger, labelTypeRegistry, editorModeController, actionDispatcher);
}

  protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
    const file = await chooseFile(["application/json"])
    if (!file) {
      return undefined
    }
    return {
      fileName: file.fileName,
      content: JSON.parse(file.content) as SavedDiagram
    }
  }

}