import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { LoadJsonCommand } from "./loadJson";

export const serializeModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LoadJsonCommand);
})