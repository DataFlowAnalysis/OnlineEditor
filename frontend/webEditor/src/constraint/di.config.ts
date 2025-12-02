import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";
import { ConstraintMenu } from "./ConstraintMenu";
import { ConstraintRegistry } from "./constraintRegistry";
import { ThemeSwitchable } from "../settings/Theme";

export const constraintModule = new ContainerModule((bind) => {
    bind(ConstraintRegistry).toSelf().inSingletonScope();

    bind(ConstraintMenu).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ConstraintMenu);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ConstraintMenu);
    bind(ThemeSwitchable).toService(ConstraintMenu)
})