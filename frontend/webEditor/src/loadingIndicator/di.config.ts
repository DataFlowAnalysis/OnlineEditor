import { ContainerModule } from "inversify";
import { LoadingIndicator } from "./loadingIndicator";
import { TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";

export const loadingIndicatorModule = new ContainerModule((bind) => {
    bind(LoadingIndicator).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(LoadingIndicator);
    bind(EDITOR_TYPES.DefaultUIElement).toService(LoadingIndicator);
});
