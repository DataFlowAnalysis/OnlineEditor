import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { LogHelloCommand } from "./log-hello";

export const commandsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LogHelloCommand);
});
