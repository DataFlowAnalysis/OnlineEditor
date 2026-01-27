import { inject, injectable } from "inversify";
import { ActionDispatcher, ILogger, MouseListener, SModelElementImpl, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { FileData, LoadJsonCommand } from "./loadJson";
import { SavedDiagram } from "./SavedDiagram";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { FileName } from "../fileName/fileName";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { EditorModeController } from "../settings/editorMode";

@injectable()
export class JsonDropHandler extends MouseListener {
    constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {
        super();
    }

    drop(_target: SModelElementImpl, ev: DragEvent): Promise<Action>[] {
        this.logger.log(this, "Drop event detected", ev);

        // Prevent default behavior which would open the file in the browser
        ev.preventDefault();

        const file = ev.dataTransfer?.files[0];
        if (!file) {
            return [];
        }

        if (file.type !== "application/json") {
            alert("Diagram file must be in JSON format");
            return [];
        }

        return [file.text().then((t) => LoadDroppedFileAction.create(file.name, JSON.parse(t)))];
    }
}

interface LoadDroppedFileAction extends Action {
    file: FileData<SavedDiagram>;
}

namespace LoadDroppedFileAction {
    export const KIND = "loadDroppedFileAction";
    export function create(fileName: string, content: SavedDiagram): LoadDroppedFileAction {
        return {
            kind: KIND,
            file: {
                fileName,
                content,
            },
        };
    }
}

export class LoadDroppedFileCommand extends LoadJsonCommand {
    static readonly KIND = LoadDroppedFileAction.KIND;

    constructor(
        @inject(TYPES.Action) private readonly action: LoadDroppedFileAction,
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
        return this.action.file;
    }
}
