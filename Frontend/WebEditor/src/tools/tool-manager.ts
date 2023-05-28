import { ContainerModule, injectable, multiInject, optional, postConstruct } from "inversify";
import { ToolManager, Tool, TYPES } from "sprotty";
import { commandPaletteModules } from "./commandPalette";
import { deleteKeyDeleteTool } from "./deleteKeyTool";
import { EDITOR_TYPES } from "../utils";

/**
 * A tool manager that gets all our custom tools using dependency injection and registers them
 * Default tools are automatically enabled when the editor is loaded.
 */
@injectable()
export class DFDToolManager extends ToolManager {
    @multiInject(EDITOR_TYPES.ITool) @optional() override tools: Tool[] = [];
    @multiInject(EDITOR_TYPES.IDefaultTool) @optional() override defaultTools: Tool[] = [];

    @postConstruct()
    protected initialize(): void {
        this.enableDefaultTools();
    }
}

export const toolManager = new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(DFDToolManager).toSelf().inSingletonScope();
    rebind(TYPES.IToolManager).toService(DFDToolManager);
});

export const toolsModules = [toolManager, ...commandPaletteModules, deleteKeyDeleteTool];
