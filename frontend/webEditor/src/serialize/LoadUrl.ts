import { Action } from "sprotty-protocol";
import { FileData, LoadJsonCommand } from "./loadJson";
import { inject } from "inversify";
import { TYPES, ILogger, ActionDispatcher } from "sprotty";
import { EditorModeController } from "../settings/editorMode";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SavedDiagram } from "./SavedDiagram";
import { FileName } from "../fileName/fileName";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";

interface LoadFromUrlAction extends Action {
    url: string;
}

export namespace LoadFromUrlAction {
    export const KIND = "loadUrl";

    export function create(url: string): LoadFromUrlAction {
        return { kind: KIND, url };
    }
}

export class LoadFromUrlCommand extends LoadJsonCommand {
    static readonly KIND = LoadFromUrlAction.KIND;

    constructor(
        @inject(TYPES.Action) private readonly action: LoadFromUrlAction,
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
        const content = await fetch(this.action.url).then((response) => response.json() as Promise<SavedDiagram>);
        const urlParts = this.action.url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        return {
            content,
            fileName,
        };
    }
}
