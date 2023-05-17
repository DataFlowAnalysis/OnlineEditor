import { ContainerModule, injectable, multiInject, optional, postConstruct } from "inversify";
import { ToolManager, Tool, TYPES } from "sprotty";
import { customCommandPaletteModule } from "./commandPalette";
import { deleteKeyDeleteTool } from "./deleteKeyTool";
import { EDITOR_TYPES } from "../utils";

@injectable()
export class TestToolManager extends ToolManager {
    // @multiInject(TYPES.ITool) @optional() override tools: Tool[] = [];
    @multiInject(EDITOR_TYPES.IDefaultTool) @optional() override defaultTools: Tool[] = [];

    @postConstruct()
    protected initialize(): void {
        this.enableDefaultTools();
    }

    override registerDefaultTools(...tools: Tool[]): void {
        for (const tool of tools) {
            this.defaultTools.push(tool);
        }
    }

    override registerTools(...tools: Tool[]): void {
        for (const tool of tools) {
            this.tools.push(tool);
        }
    }

    override enable(toolIds: string[]): void {
        this.disableActiveTools();
        const tools = toolIds.map((id) => this.tool(id));
        tools.forEach((tool) => {
            if (tool !== undefined) {
                tool.enable();
                this.actives.push(tool);
            }
        });
    }
}

export const toolManager = new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(TestToolManager).toSelf().inSingletonScope();
    rebind(TYPES.IToolManager).toService(TestToolManager);
});

export const toolsModules = [toolManager, customCommandPaletteModule, deleteKeyDeleteTool];
