import { ContainerModule } from "inversify";
import { LabelTypeRegistry } from "./labelTypeRegistry";
import { DfdNodeLabelRenderer } from "./labelRenderer";
import { EDITOR_TYPES } from "../../utils";
import { DfdLabelDropTool, DfdLabelMouseDropListener } from "./dropTool";
import { LabelTypeEditorUI } from "./labelTypeEditor";
import { TYPES, configureCommand } from "sprotty";
import {
    AddLabelAssignmentCommand,
    DeleteLabelAssignmentCommand,
    DeleteLabelTypeCommand,
    DeleteLabelTypeValueCommand,
} from "./commands";

// This module contains the components required for the dfd node labels.
// This includes a registry for the label types, a UI to manage them,
// a renderer to display them inside nodes and commands to add/delete them to nodes.

export const dfdLabelModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(LabelTypeRegistry).toSelf().inSingletonScope();
    bind(DfdNodeLabelRenderer).toSelf().inSingletonScope();
    bind(DfdLabelMouseDropListener).toSelf().inSingletonScope();
    bind(DfdLabelDropTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.IDefaultTool).to(DfdLabelDropTool);
    bind(LabelTypeEditorUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).to(LabelTypeEditorUI);
    bind(EDITOR_TYPES.DefaultUIElement).to(LabelTypeEditorUI);

    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, AddLabelAssignmentCommand);
    configureCommand(context, DeleteLabelAssignmentCommand);
    configureCommand(context, DeleteLabelTypeValueCommand);
    configureCommand(context, DeleteLabelTypeCommand);
});
