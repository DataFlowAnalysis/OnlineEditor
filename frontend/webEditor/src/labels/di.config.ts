import { ContainerModule } from "inversify";
import { LabelTypeRegistry } from "./LabelTypeRegistry";
import { LabelTypeEditorUi } from "./LabelTypeEditorUi";
import { TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";

export const labelModule = new ContainerModule((bind) => {
    bind(LabelTypeRegistry).toSelf().inSingletonScope()

    bind(LabelTypeEditorUi).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LabelTypeEditorUi);
    bind(EDITOR_TYPES.DefaultUIElement).to(LabelTypeEditorUi);
})