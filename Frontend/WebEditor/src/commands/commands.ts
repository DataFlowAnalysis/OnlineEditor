import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { LogHelloCommand } from "./log-hello";
import { SaveDiagramCommand } from "./save";
import { LoadDiagramCommand } from "./load";
import { LoadDefaultDiagramCommand } from "./loadDefaultDiagram";
import { AddLabelAssignmentCommand, DeleteLabelTypeValueCommand } from "./labelTypes";

// Bundles all defined commands into a inversify module that can be loaded to make
// all commands available to sprotty.

export const commandsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LogHelloCommand);
    configureCommand(context, SaveDiagramCommand);
    configureCommand(context, LoadDiagramCommand);
    configureCommand(context, LoadDefaultDiagramCommand);
    configureCommand(context, AddLabelAssignmentCommand);
    configureCommand(context, DeleteLabelTypeValueCommand);
});
