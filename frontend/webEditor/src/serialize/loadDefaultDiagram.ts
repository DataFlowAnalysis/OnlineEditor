import { FileData, LoadJsonCommand } from "./loadJson";
import defaultDiagram from './defaultDiagram.json'
import { SavedDiagram } from "./SavedDiagram";
import { Action } from "sprotty-protocol";
import { inject } from "inversify";
import { TYPES, ILogger } from "sprotty";
import { EditorModeController } from "../editorMode/EditorModeController";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";

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
    ) {
        super(logger, labelTypeRegistry, editorModeController);
    }

    protected async getFile(): Promise<FileData<SavedDiagram> | undefined> {
        return {
            fileName: "diagram.json",
            content: defaultDiagram as SavedDiagram
        }
    }
}