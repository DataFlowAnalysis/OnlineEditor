import { ContainerModule } from "inversify";
import { configureCommand, TYPES } from "sprotty";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { LabelingProcessCommand } from "./labelingProcessCommand.ts";
import { EDITOR_TYPES } from "../editorTypes.ts";

export const labelingProcessModule = new ContainerModule((bind, _, isBound) => {
    bind(LabelingProcessUi).toSelf().inSingletonScope();
    configureCommand({bind, isBound}, LabelingProcessCommand)

    bind(TYPES.IUIExtension).toService(LabelingProcessUi);
    bind(EDITOR_TYPES.DefaultUIElement).to(LabelingProcessUi);
})