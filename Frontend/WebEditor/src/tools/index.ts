import { commandPaletteModules } from "./commandPalette";
import { deleteKeyDeleteTool } from "./deleteKeyTool";
import { edgeCreationToolModule } from "./edgeCreationTool";
import { nodeCreationToolModule } from "./nodeCreationTool";
import { toolManager } from "./toolManager";

// Exports all the tool related inversify modules.
// This includes the configuration for the sprotty tool manager and all implemented tools.

export const toolModules = [
    toolManager,
    ...commandPaletteModules,
    edgeCreationToolModule,
    nodeCreationToolModule,
    deleteKeyDeleteTool,
];
