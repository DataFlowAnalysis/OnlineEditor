import { ContainerModule } from "inversify";
import { configureCommand, TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";
import { ConstraintMenu } from "./ConstraintMenu";
import { ConstraintRegistry } from "./constraintRegistry";
import { ThemeSwitchable } from "../settings/Theme";
import { TFGManager } from "./tfgManager";
import { SelectConstraintsCommand } from "./selection";

export const constraintModule = new ContainerModule((bind, unbind, isBound) => {
    bind(ConstraintRegistry).toSelf().inSingletonScope();

    bind(ConstraintMenu).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ConstraintMenu);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ConstraintMenu);
    bind(ThemeSwitchable).toService(ConstraintMenu)

    bind(TFGManager).toSelf().inSingletonScope()
    configureCommand({bind, isBound}, SelectConstraintsCommand)
})