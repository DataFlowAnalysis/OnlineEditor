import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { LoadDefaultDiagramCommand } from "./loadDefaultDiagram";
import { LoadDfdAndDdFileCommand } from "./loadDfdAndDdFile";
import { LoadJsonFileCommand } from "./loadJsonFile";
import { LoadPalladioFileCommand } from "./loadPalladioFile";

export const serializeModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LoadDefaultDiagramCommand);
    configureCommand(context, LoadJsonFileCommand);
    configureCommand(context, LoadDfdAndDdFileCommand);
    configureCommand(context, LoadPalladioFileCommand);
})