import { Action } from "sprotty-protocol";
import { FileData, LoadJsonCommand } from "./loadJson";
import { chooseFiles } from "./fileChooser";
import { inject } from "inversify";
import { DfdWebSocket } from "../webSocket/webSocket";
import { TYPES, ILogger, ActionDispatcher } from "sprotty";
import { EditorModeController } from "../settings/editorMode";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SavedDiagram } from "./SavedDiagram";
import { FileName } from "../fileName/fileName";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";

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
         @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(FileName) fileName: FileName,
        @inject(DfdWebSocket) private dfdWebSocket: DfdWebSocket,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
    ) {
        super(logger, labelTypeRegistry, constraintRegistry, editorModeController, actionDispatcher, fileName);
    }

    protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
        const files = await chooseFiles([".dataflowdiagram", ".datadictionary"], 2);
        const dataflowFileContent = files.find((file) => file.fileName.endsWith(".dataflowdiagram"))?.content;
        const dictionaryFileContent = files.find((file) => file.fileName.endsWith(".datadictionary"))?.content;
        if (!dataflowFileContent || !dictionaryFileContent) {
            return undefined;
        }

        const oldFileName = this.fileName.getName();
        this.fileName.setName(files[0].fileName);

        return this.dfdWebSocket.requestDiagram("DFD:" + dataflowFileContent + "\n:DD:\n" + dictionaryFileContent).catch((e) => {
            this.fileName.setName(oldFileName);
            throw e;
        })
    }
}
