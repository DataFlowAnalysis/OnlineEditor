import { ContainerModule } from "inversify";
import { EDITOR_TYPES } from "../../utils";
import { EdgeCreationTool, EdgeCreationToolMouseListener } from "./edgeCreationTool";
import { NodeCreationTool, NodeCreationToolMouseListener } from "./nodeCreationTool";
import { ToolPaletteUI } from "./toolPalette";
import { EnableDefaultToolsAction, TYPES, configureActionHandler } from "sprotty";

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
