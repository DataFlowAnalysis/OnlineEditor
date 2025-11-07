import { FileData, LoadJsonCommand } from "./loadJson";
import defaultDiagram from './defaultDiagram.json'
import { SavedDiagram } from "./SavedDiagram";
import { Action } from "sprotty-protocol";
import { inject } from "inversify";
import { TYPES, ILogger, ActionDispatcher } from "sprotty";
import { EditorModeController } from "../editorMode/EditorModeController";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { FileName } from "../fileName/fileName";

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
        @inject(EditorModeController) editorModeController: EditorModeController,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
        @inject(FileName) fileName: FileName
    ) {
        super(logger, labelTypeRegistry, editorModeController, actionDispatcher, fileName);
    }

    protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
        return {
            fileName: "diagram.json",
            content: defaultDiagram as SavedDiagram
        }
    }
}