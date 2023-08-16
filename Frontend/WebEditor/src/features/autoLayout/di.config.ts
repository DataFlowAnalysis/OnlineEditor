import { ContainerModule } from "inversify";
import { TYPES, configureCommand } from "sprotty";
import { ElkFactory, ILayoutConfigurator } from "sprotty-elk";
import { LayoutModelCommand } from "./command";
import { DfdElkLayoutEngine, DfdLayoutConfigurator, elkFactory } from "./layouter";

export const dfdAutoLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(DfdElkLayoutEngine).toSelf().inSingletonScope();
    bind(TYPES.IModelLayoutEngine).toService(DfdElkLayoutEngine);
    rebind(ILayoutConfigurator).to(DfdLayoutConfigurator);
    bind(ElkFactory).toConstantValue(elkFactory);

    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LayoutModelCommand);
});
