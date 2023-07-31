import { ContainerModule } from "inversify";
import { EDITOR_TYPES } from "../../utils";
import { EdgeCreationTool, EdgeCreationToolMouseListener } from "./edgeCreationTool";
import { NodeCreationTool, NodeCreationToolMouseListener } from "./nodeCreationTool";
import { ToolPaletteUI } from "./toolPalette";
import { EnableDefaultToolsAction, TYPES, configureActionHandler } from "sprotty";

// This module contains an UI extension that adds a tool palette to the editor.
// This tool palette allows the user to create new nodes and edges.
// Additionally it contains the tools that are used to create the nodes and edges.

export const toolPaletteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(EdgeCreationToolMouseListener).toSelf().inSingletonScope();
    bind(EdgeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.ITool).toService(EdgeCreationTool);

    bind(NodeCreationToolMouseListener).toSelf().inSingletonScope();
    bind(NodeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.ITool).toService(NodeCreationTool);

    const context = { bind, unbind, isBound, rebind };
    bind(ToolPaletteUI).toSelf().inSingletonScope();
    configureActionHandler(context, EnableDefaultToolsAction.KIND, ToolPaletteUI);
    bind(TYPES.IUIExtension).toService(ToolPaletteUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(ToolPaletteUI);
});
