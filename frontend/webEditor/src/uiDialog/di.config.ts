import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { ShowDialogCommand } from "./showDialogCommand.ts";

export const uiDialogModule = new ContainerModule((bind, _, isBound) => {
    configureCommand({bind, isBound}, ShowDialogCommand);
})