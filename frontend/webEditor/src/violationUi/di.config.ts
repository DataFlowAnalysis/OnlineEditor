import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { ViolationUI } from "./violationUi";
import { EDITOR_TYPES } from "../editorTypes";
import { ViolationService } from "./violationService";

export const violationUiModule = new ContainerModule((bind) => {
    bind(ViolationUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ViolationUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ViolationUI);
    bind(ViolationService).toSelf().inSingletonScope();
});
