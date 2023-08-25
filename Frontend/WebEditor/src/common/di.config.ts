import { ContainerModule } from "inversify";
import {
    CenterGridSnapper,
    ConsoleLogger,
    CreateElementCommand,
    LocalModelSource,
    LogLevel,
    TYPES,
    configureCommand,
} from "sprotty";
import { ServerCommandPaletteActionProvider } from "./commandPalette";
import { DfdToolManager } from "./toolManager";
import { HelpUI } from "./helpUi";
import { DelKeyDeleteTool } from "./deleteKeyTool";
import { EDITOR_TYPES } from "../utils";
import { DynamicChildrenProcessor } from "../features/dfdElements/dynamicChildren";

import "./commonStyling.css";

export const dfdCommonModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ServerCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(ServerCommandPaletteActionProvider);

    bind(DelKeyDeleteTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.IDefaultTool).toService(DelKeyDeleteTool);

    bind(HelpUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(HelpUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(HelpUI);

    bind(DfdToolManager).toSelf().inSingletonScope();
    bind(TYPES.IToolManager).toService(DfdToolManager);

    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
    bind(TYPES.ISnapper).to(CenterGridSnapper);
    bind(DynamicChildrenProcessor).toSelf().inSingletonScope();

    // For some reason the CreateElementAction and Command exist but in no sprotty module is the command registered, so we need to do this here.
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, CreateElementCommand);
});
