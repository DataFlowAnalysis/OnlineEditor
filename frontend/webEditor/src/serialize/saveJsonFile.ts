import { CommandExecutionContext, TYPES } from "sprotty";
import { FileData } from "./loadJson";
import { SaveFileCommand } from "./saveFile";
import { EditorModeController } from "../settings/editorMode";
import { inject } from "inversify";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { Action } from "sprotty-protocol";
import { FileName } from "../fileName/fileName";
import { SETTINGS } from "../settings/Settings";

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
    @inject(SETTINGS.Mode) editorModeController: EditorModeController,
    @inject(FileName) private readonly fileName: FileName
  ) {
    super(LabelTypeRegistry, editorModeController);
  }

  getFiles(context: CommandExecutionContext): Promise<FileData<string>[]> {
    const fileData: FileData<string> = {
      fileName: this.fileName.getName() + ".json",
      content: JSON.stringify(this.createSavedDiagram(context))
    };
    return Promise.resolve([fileData]);
  }

}