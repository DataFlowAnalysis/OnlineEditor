import { ContainerModule } from "inversify";
import { EDITOR_TYPES } from "../../utils";
import { DfdToolDisableKeyListener } from "./tool";
import { AddElementToGraphCommand } from "./creationTool";
import { EdgeCreationTool } from "./edgeCreationTool";
import { NodeCreationTool } from "./nodeCreationTool";
import { PortCreationTool } from "./portCreationTool";
import { ToolPaletteUI } from "./toolPalette";
import { CreateSnappedElementCommand } from "./createSnappedElementCommand";
import {
    CommitModelAction,
    EmptyView,
    SNodeImpl,
    TYPES,
    configureActionHandler,
    configureCommand,
    configureModelElement,
} from "sprotty";

// This module contains an UI extension that adds a tool palette to the editor.
// This tool palette allows the user to create new nodes and edges.
// Additionally it contains the tools that are used to create the nodes and edges.

export const toolPaletteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    configureCommand(context, CreateSnappedElementCommand);

    bind(DfdToolDisableKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(DfdToolDisableKeyListener);

    configureModelElement(context, "empty-node", SNodeImpl, EmptyView);
    configureCommand(context, AddElementToGraphCommand);

    bind(NodeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.DfdTool).toService(NodeCreationTool);

    bind(EdgeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.DfdTool).toService(EdgeCreationTool);

    bind(PortCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.DfdTool).toService(PortCreationTool);

    bind(ToolPaletteUI).toSelf().inSingletonScope();
    configureActionHandler(context, CommitModelAction.KIND, ToolPaletteUI);
    bind(TYPES.IUIExtension).toService(ToolPaletteUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ToolPaletteUI);
});
