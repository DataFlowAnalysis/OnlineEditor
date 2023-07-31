import { configureCommand } from "sprotty";
import { LoadDiagramCommand } from "./load";
import { SaveDiagramCommand } from "./save";
import { LoadDefaultDiagramCommand } from "./loadDefaultDiagram";
import { ContainerModule } from "inversify";

export const serializeModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LoadDiagramCommand);
    configureCommand(context, LoadDefaultDiagramCommand);
    configureCommand(context, SaveDiagramCommand);
});
