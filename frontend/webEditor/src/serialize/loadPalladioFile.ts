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
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";

export namespace LoadPalladioFileAction {
    export const KIND = "loadPcmFile";

    export function create(): Action {
        return { kind: KIND };
    }
}

export class LoadPalladioFileCommand extends LoadJsonCommand {
    static readonly KIND = LoadPalladioFileAction.KIND;
    private static readonly FILE_ENDINGS = [".pddc", ".allocation", ".nodecharacteristics", ".repository", ".resourceenvironment", ".system", ".usagemodel"];

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
        @inject(FileName) fileName: FileName,
        @inject(DfdWebSocket) private dfdWebSocket: DfdWebSocket,
        @inject(LoadingIndicator) loadingIndicator: LoadingIndicator
    ) {
        super(logger, labelTypeRegistry, constraintRegistry, editorModeController, actionDispatcher, fileName, loadingIndicator);
    }

    protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
        const files = await chooseFiles(LoadPalladioFileCommand.FILE_ENDINGS, LoadPalladioFileCommand.FILE_ENDINGS.length);
        
        if (
            LoadPalladioFileCommand.FILE_ENDINGS.some(ending =>
                !files.find(file => file.fileName.endsWith(ending))
            )
        ) {
            throw new Error("Please select one file of each required type: .pddc, .allocation, .nodecharacteristics, .repository, .resourceenvironment, .system, .usagemodel");
        }
        const oldFileName = this.fileName.getName();
        this.fileName.setName(files[0].fileName)

        return this.dfdWebSocket.requestDiagram(files.map((f) => `${f.fileName}:${f.content}`).join("---FILE---")).catch((e) => {
            this.fileName.setName(oldFileName);
            throw e;
        });
    }
}
