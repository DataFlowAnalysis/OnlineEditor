import { ContainerModule } from "inversify";
import { EditorModeController } from "./EditorModeController";

export const editorModeModule = new ContainerModule((bind) => {
    bind(EditorModeController).toSelf().inSingletonScope();
})