import { Action } from "sprotty-protocol";
import { FileData, LoadJsonCommand } from "./loadJson";
import { chooseFiles } from "./fileChooser";
import { inject } from "inversify";
import { DfdWebSocket } from "../webSocket/webSocket";
import { TYPES, ILogger } from "sprotty";
import { EditorModeController } from "../editorMode/EditorModeController";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SavedDiagram } from "./SavedDiagram";

export namespace LoadDfdAndDdFileAction {
    export const KIND = "loadDfdAndDdFile";

    export function create(): Action {
        return { kind: KIND };
    }
}

export class LoadDfdAndDdFileCommand extends LoadJsonCommand {
    static readonly KIND = LoadDfdAndDdFileAction.KIND;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(EditorModeController) editorModeController: EditorModeController,
        @inject(DfdWebSocket) private dfdWebSocket: DfdWebSocket,
    ) {
        super(logger, labelTypeRegistry, editorModeController);
    }

    protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
        const files = await chooseFiles([".dataflowdiagram", ".datadictionary"], 2);
        const dataflowFileContent = files.find((file) => file.fileName.endsWith(".dataflowdiagram"))?.content;
        const dictionaryFileContent = files.find((file) => file.fileName.endsWith(".datadictionary"))?.content;
        if (!dataflowFileContent || !dictionaryFileContent) {
            return undefined;
        }
        return this.dfdWebSocket.requestDiagram("DFD:" + dataflowFileContent + "\n:DD:\n" + dictionaryFileContent);
    }
}
