import { ContainerModule } from "inversify";
import { configureCommand, TYPES } from "sprotty";
import { LoadDefaultDiagramCommand } from "./loadDefaultDiagram";
import { LoadDfdAndDdFileCommand } from "./loadDfdAndDdFile";
import { LoadJsonFileCommand } from "./loadJsonFile";
import { LoadPalladioFileCommand } from "./loadPalladioFile";
import { DfdModelFactory } from "./ModelFactory";
import { SaveJsonFileCommand } from "./saveJsonFile";
import { SaveDfdAndDdFileCommand } from "./saveDfdAndDdFile";

export const serializeModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LoadDefaultDiagramCommand);
    configureCommand(context, LoadJsonFileCommand);
    configureCommand(context, LoadDfdAndDdFileCommand);
    configureCommand(context, LoadPalladioFileCommand);
    configureCommand(context, SaveJsonFileCommand)
    configureCommand(context, SaveDfdAndDdFileCommand)
    
    rebind(TYPES.IModelFactory).to(DfdModelFactory);
})