import { CommandExecutionContext, TYPES } from "sprotty";
import { FileData } from "./loadJson";
import { SaveFileCommand } from "./SaveFile";
import { inject } from "inversify";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { EditorModeController } from "../editorMode/EditorModeController";
import { DfdWebSocket } from "../webSocket/webSocket";
import { Action } from "sprotty-protocol";
import { FileName } from "../fileName/fileName";

export namespace SaveDfdAndDdFileAction {
  export const KIND = 'saveDfdAndDdFile'
  export function create(): Action {
    return { kind: KIND }
  }
}

export class SaveDfdAndDdFileCommand extends SaveFileCommand {

  static readonly KIND = SaveDfdAndDdFileAction.KIND;
  private static readonly CLOSING_TAG = "</dataflowdiagram:DataFlowDiagram>";

  constructor(
      @inject(TYPES.Action) _: Action,
    @inject(LabelTypeRegistry) LabelTypeRegistry: LabelTypeRegistry,
    @inject(EditorModeController) editorModeController: EditorModeController,
    @inject(DfdWebSocket) private readonly dfdWebSocket: DfdWebSocket,
    @inject(FileName) private readonly fileName: FileName
  ) {
    super(LabelTypeRegistry, editorModeController);
  }

  async getFiles(context: CommandExecutionContext): Promise<FileData<string>[]> {
    const savedDiagram = this.createSavedDiagram(context);

    const response = await this.dfdWebSocket.sendMessage("Json2DFD:" + JSON.stringify(savedDiagram));
    const endIndex = response.indexOf(SaveDfdAndDdFileCommand.CLOSING_TAG) + SaveDfdAndDdFileCommand.CLOSING_TAG.length;
    const dfdContent = response.substring(0, endIndex).trim();
    const ddContent = response.substring(endIndex).trim();

    const fileName = this.fileName.getName();
    return Promise.resolve([{
      fileName: fileName + ".dataflowdiagram",
      content: dfdContent
    }, {
      fileName: fileName + ".datadictionary",
      content: ddContent
    }]);
  }

}