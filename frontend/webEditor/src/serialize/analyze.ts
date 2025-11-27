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
    ) {
        super(logger, labelTypeRegistry, constraintRegistry, editorModeController, actionDispatcher, fileName);
    }

    protected async getFile(context: CommandExecutionContext): Promise<FileData<SavedDiagram> | undefined> {
        const savedDiagram = {
              model: context.modelFactory.createSchema(context.root),
              labelTypes: this.labelTypeRegistry.getLabelTypes(),
              constraints: this.constraintRegistry.getConstraintList(),
              mode: this.editorModeController.get(),
              version: CURRENT_VERSION
        }
        return await this.dfdWebSocket.requestDiagram("Json:" + JSON.stringify(savedDiagram))
    }

}