import { FileData, LoadJsonCommand } from "./loadJson";
import shopDiagram from "../diagrams/shopDiagram.json";
import dacDiagram from "../diagrams/dacDiagram.json";
import { SavedDiagram } from "./SavedDiagram";
import { Action } from "sprotty-protocol";
import { inject } from "inversify";
import { TYPES, ILogger, ActionDispatcher } from "sprotty";
import { EditorModeController } from "../settings/editorMode";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { FileName } from "../fileName/fileName";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";

export namespace LoadDefaultDiagramAction {
    export const KIND = "loadDefaultDiagram";

    export function create(): Action {
        return { kind: KIND };
    }
}

export class LoadDefaultDiagramCommand extends LoadJsonCommand {
    static readonly KIND = LoadDefaultDiagramAction.KIND;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
        @inject(FileName) fileName: FileName,
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

    protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
        return this.loadDAC();
    }

    protected async loadOnlineShop() {
        return {
            fileName: "online-shop",
            content: shopDiagram as SavedDiagram,
        };
    }

    protected async loadDAC() {
        return {
            fileName: "dac",
            content: dacDiagram as SavedDiagram,
        };
    }
}
