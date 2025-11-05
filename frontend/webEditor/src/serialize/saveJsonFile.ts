import { CommandExecutionContext, TYPES } from "sprotty";
import { FileData } from "./loadJson";
import { SaveFileCommand } from "./SaveFile";
import { EditorModeController } from "../editorMode/EditorModeController";
import { inject } from "inversify";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { Action } from "sprotty-protocol";

export namespace SaveJsonFileAction {
  export const KIND = 'saveJsonFile'
  export function create(): Action {
    return { kind: KIND }
  }
}

export class SaveJsonFileCommand extends SaveFileCommand {
  static readonly KIND = SaveJsonFileAction.KIND;

  constructor(
    @inject(TYPES.Action) _: Action,
    @inject(LabelTypeRegistry) LabelTypeRegistry: LabelTypeRegistry,
    @inject(EditorModeController) editorModeController: EditorModeController
  ) {
    super(LabelTypeRegistry, editorModeController);
  }

  getFiles(context: CommandExecutionContext): Promise<FileData<string>[]> {
    const fileData: FileData<string> = {
      fileName: "TODO.json",
      content: JSON.stringify(this.createSavedDiagram(context))
    };
    return Promise.resolve([fileData]);
  }

}