import { CommandExecutionContext, CommandReturn, SModelRootImpl } from "sprotty";
import { FileData } from "./loadJson";
import { SavedDiagramCreatorCommand } from "./savedDiagramCreator";

export abstract class SaveFileCommand extends SavedDiagramCreatorCommand {

  abstract getFiles(context: CommandExecutionContext): Promise<FileData<string>[]>;

  async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
    const files = await this.getFiles(context)
    for (const file of files) {
      this.downloadFile(file);
    }

    return context.root;
  }
  undo(context: CommandExecutionContext): CommandReturn {
    return context.root;
  }
  redo(context: CommandExecutionContext): CommandReturn {
    return context.root;
  }

  private downloadFile(file: FileData<string>) {
    const element = document.createElement('a');
    const fileBlob = new Blob([file.content], { type: 'application/json' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = file.fileName;
    element.click();
    URL.revokeObjectURL(element.href);
    element.remove()
  }
}