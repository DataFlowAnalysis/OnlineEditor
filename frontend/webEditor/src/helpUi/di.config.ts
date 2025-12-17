import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { HelpUI } from "./helpUi";
import { EDITOR_TYPES } from "../editorTypes";

export const helpUiModule = new ContainerModule((bind) => {
    bind(HelpUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(HelpUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(HelpUI);
});
