import { ContainerModule } from "inversify";
import { DeleteElementCommand, EditLabelMouseListener } from "sprotty";
import { EditorModeAwareDeleteElementCommand, EditorModeAwareEditLabelMouseListener } from "./overwrites";

export const editorModeOverwritesModule = new ContainerModule((_, __, ___, rebind) => {
    rebind(EditLabelMouseListener).to(EditorModeAwareEditLabelMouseListener);
    rebind(DeleteElementCommand).to(EditorModeAwareDeleteElementCommand);
});
