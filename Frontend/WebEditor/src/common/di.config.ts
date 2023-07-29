import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { ServerCommandPaletteActionProvider } from "./commandPalette";
import { DFDToolManager } from "./toolManager";
import { HelpUI } from "./helpUi";
import { DelKeyDeleteTool } from "./deleteKeyTool";
import { EDITOR_TYPES } from "../utils";

import "./commonStyling.css";

export const dfdCommonModule = new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(ServerCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(ServerCommandPaletteActionProvider);

    bind(DelKeyDeleteTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.IDefaultTool).toService(DelKeyDeleteTool);

    bind(HelpUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(HelpUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(HelpUI);

    bind(DFDToolManager).toSelf().inSingletonScope();
    rebind(TYPES.IToolManager).toService(DFDToolManager);
});
