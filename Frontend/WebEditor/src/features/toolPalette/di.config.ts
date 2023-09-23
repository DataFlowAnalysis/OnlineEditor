import { ContainerModule } from "inversify";
import { EDITOR_TYPES } from "../../utils";
import { EdgeCreationTool } from "./edgeCreationTool";
import { NodeCreationTool } from "./nodeCreationTool";
import { ToolPaletteUI } from "./toolPalette";
import { CommitModelAction, TYPES, configureActionHandler, configureCommand } from "sprotty";
import { DfdToolDisableKeyListener } from "./tool";
import { PortCreationTool } from "./portCreationTool";
import { CreateSnappedElementCommand } from "./createSnappedElementAction";

// This module contains an UI extension that adds a tool palette to the editor.
// This tool palette allows the user to create new nodes and edges.
// Additionally it contains the tools that are used to create the nodes and edges.

export const toolPaletteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    configureCommand(context, CreateSnappedElementCommand);

    bind(DfdToolDisableKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(DfdToolDisableKeyListener);

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
