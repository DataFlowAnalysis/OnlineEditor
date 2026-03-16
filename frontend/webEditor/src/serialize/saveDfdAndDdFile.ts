import { CommandExecutionContext, TYPES } from "sprotty";
import { FileData } from "./loadJson";
import { SaveFileCommand } from "./saveFile";
import { inject } from "inversify";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { EditorModeController } from "../settings/editorMode";
import { DfdWebSocket } from "../webSocket/webSocket";
import { Action } from "sprotty-protocol";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";

export namespace SaveDfdAndDdFileAction {
    export const KIND = "saveDfdAndDdFile";
    export function create(): Action {
        return { kind: KIND };
    }
}

export class SaveDfdAndDdFileCommand extends SaveFileCommand {
    static readonly KIND = SaveDfdAndDdFileAction.KIND;
    private static readonly CLOSING_TAG = "</dataflowdiagram:DataFlowDiagram>";

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(DfdWebSocket) private readonly dfdWebSocket: DfdWebSocket,
        @inject(LoadingIndicator) loadingIndicator: LoadingIndicator,
    ) {
        super(labelTypeRegistry, constraintRegistry, editorModeController, loadingIndicator);
    }

    async getFiles(context: CommandExecutionContext): Promise<FileData<string>[]> {
        const savedDiagram = this.createSavedDiagram(context);

        const response = await this.dfdWebSocket.sendMessage("Json2DFD:" + JSON.stringify(savedDiagram));
        const nameEndIndex = response.indexOf(":");
        const name = response.substring(0, nameEndIndex);
        const endIndex =
            response.indexOf(SaveDfdAndDdFileCommand.CLOSING_TAG) + SaveDfdAndDdFileCommand.CLOSING_TAG.length;
        const dfdContent = response.substring(nameEndIndex + 1, endIndex).trim();
        const ddContent = response.substring(endIndex).trim();

        return Promise.resolve([
            {
                fileName: name + ".dataflowdiagram",
                content: dfdContent,
            },
            {
                fileName: name + ".datadictionary",
                content: ddContent,
            },
        ]);
    }
}
