import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";
import { ConstraintMenu } from "./ConstraintMenu";
import { ConstraintRegistry } from "./constraintRegistry";

export const constraintModule = new ContainerModule((bind) => {
    bind(ConstraintRegistry).toSelf().inSingletonScope();

    bind(ConstraintMenu).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ConstraintMenu);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ConstraintMenu);
})