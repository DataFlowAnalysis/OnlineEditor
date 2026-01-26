import { ActionDispatcher, CommandExecutionContext, ILogger, TYPES } from "sprotty";
import { FileData, LoadJsonCommand } from "./loadJson";
import { CURRENT_VERSION, SavedDiagram } from "./SavedDiagram";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SETTINGS } from "../settings/Settings";
import { FileName } from "../fileName/fileName";
import { DfdWebSocket } from "../webSocket/webSocket";
import { inject } from "inversify";
import { EditorModeController } from "../settings/editorMode";
import { Action } from "sprotty-protocol";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import {
    isThreatModelingLabelType,
    threatModelingLabelTypeToBackendPayload,
} from "../labels/ThreatModelingLabelType.ts";

export namespace AnalyzeAction {
    export const KIND = "analyze";

    export function create(): Action {
        return { kind: KIND };
    }
}
export class AnalyzeCommand extends LoadJsonCommand {
    static readonly KIND = AnalyzeAction.KIND;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(FileName) fileName: FileName,
        @inject(DfdWebSocket) private readonly dfdWebSocket: DfdWebSocket,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
        @inject(LoadingIndicator) loadingIndicator: LoadingIndicator,
    ) {
        super(
            logger,
            labelTypeRegistry,
            constraintRegistry,
            editorModeController,
            actionDispatcher,
            fileName,
            loadingIndicator,
        );
    }

    protected async getFile(context: CommandExecutionContext): Promise<FileData<SavedDiagram> | undefined> {
        const savedDiagram = {
            model: context.modelFactory.createSchema(context.root),
            labelTypes: this.labelTypeRegistry.getLabelTypes().map(label =>
                isThreatModelingLabelType(label) ?
                    threatModelingLabelTypeToBackendPayload(label, true)
                    : label
            ),
            constraints: this.constraintRegistry.getConstraintList(),
            mode: this.editorModeController.get(),
            version: CURRENT_VERSION,
        };
        return await this.dfdWebSocket.requestDiagram("Json:" + JSON.stringify(savedDiagram));
    }
}