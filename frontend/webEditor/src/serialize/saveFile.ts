import { CommandExecutionContext, CommandReturn, SModelRootImpl } from "sprotty";
import { FileData } from "./loadJson";
import { SavedDiagramCreatorCommand } from "./savedDiagramCreator";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { EditorModeController } from "../settings/editorMode";

export abstract class SaveFileCommand extends SavedDiagramCreatorCommand {
    constructor(
        labelTypeRegistry: LabelTypeRegistry,
        constraintRegistry: ConstraintRegistry,
        editorModeController: EditorModeController,
        private readonly loadingIndicator: LoadingIndicator,
    ) {
        super(labelTypeRegistry, constraintRegistry, editorModeController);
    }

    abstract getFiles(context: CommandExecutionContext): Promise<FileData<string>[]>;

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        this.loadingIndicator.showIndicator("Saving diagram...");
        const files = await this.getFiles(context);
        for (const file of files) {
            this.downloadFile(file);
        }

        this.loadingIndicator.hide();
        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    private downloadFile(file: FileData<string>) {
        const element = document.createElement("a");
        const fileBlob = new Blob([file.content], { type: "application/json" });
        element.href = URL.createObjectURL(fileBlob);
        element.download = file.fileName;
        element.click();
        URL.revokeObjectURL(element.href);
        element.remove();
    }
}
