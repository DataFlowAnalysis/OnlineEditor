import { ContainerModule } from "inversify";
import { AddElementToGraphCommand, CreationToolDisableKeyListener } from "./creationTool";
import { EdgeCreationTool } from "./edgeCreationTool";
import { NodeCreationTool } from "./nodeCreationTool";
import { PortCreationTool } from "./portCreationTool";
import { ToolPaletteUI } from "./toolPalette";
import {
    CommitModelAction,
    EmptyView,
    SNodeImpl,
    TYPES,
    configureActionHandler,
    configureCommand,
    configureModelElement,
} from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";

// This module contains an UI extension that adds a tool palette to the editor.
// This tool palette allows the user to create new nodes and edges.
// Additionally it contains the tools that are used to create the nodes and edges.

export const toolPaletteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    bind(CreationToolDisableKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(CreationToolDisableKeyListener);

    configureModelElement(context, "empty-node", SNodeImpl, EmptyView);
    configureCommand(context, AddElementToGraphCommand);

    bind(NodeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.CreationTool).toService(NodeCreationTool);

    bind(EdgeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.CreationTool).toService(EdgeCreationTool);

    bind(PortCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.CreationTool).toService(PortCreationTool);

    bind(ToolPaletteUI).toSelf().inSingletonScope();
    configureActionHandler(context, CommitModelAction.KIND, ToolPaletteUI);
    bind(TYPES.IUIExtension).toService(ToolPaletteUI);
    bind(TYPES.KeyListener).toService(ToolPaletteUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ToolPaletteUI);
});
