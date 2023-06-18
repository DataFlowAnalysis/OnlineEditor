import { commandPaletteModules } from "./commandPalette";
import { deleteKeyDeleteTool } from "./deleteKeyTool";
import { edgeCreationTool } from "./edgeCreationTool";
import { mouseDroppableTool } from "./mouseDroppableListener";
import { toolManager } from "./toolManager";
import { toolPaletteModule } from "./toolPalette";

// Exports all the tool related inversify modules.
// This includes the configuration for the sprotty tool manager and all implemented tools.

export const toolsModules = [
    toolManager,
    ...commandPaletteModules,
    edgeCreationTool,
    deleteKeyDeleteTool,
    mouseDroppableTool,
    toolPaletteModule,
];
