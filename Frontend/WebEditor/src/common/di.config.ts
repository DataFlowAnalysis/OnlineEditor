import { ContainerModule } from "inversify";
import {
    CenterGridSnapper,
    CenterKeyboardListener,
    ConsoleLogger,
    CreateElementCommand,
    LocalModelSource,
    LogLevel,
    TYPES,
    configureCommand,
    configureViewerOptions,
} from "sprotty";
import { ServerCommandPaletteActionProvider } from "./commandPalette";
import { HelpUI } from "./helpUi";
import { DeleteKeyListener } from "./deleteKeyListener";
import { EDITOR_TYPES } from "../utils";
import { DynamicChildrenProcessor } from "../features/dfdElements/dynamicChildren";
import { FitToScreenKeyListener as CenterDiagramKeyListener } from "./fitToScreenKeyListener";
import { CopyPasteFeature, PasteClipboardCommand } from "./copyPaste";

import "./commonStyling.css";

export const dfdCommonModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    bind(ServerCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(ServerCommandPaletteActionProvider);

    bind(DeleteKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(DeleteKeyListener);
    bind(CenterDiagramKeyListener).toSelf().inSingletonScope();
    rebind(CenterKeyboardListener).toService(CenterDiagramKeyListener);

    bind(TYPES.KeyListener).to(CopyPasteFeature).inSingletonScope();
    configureCommand(context, PasteClipboardCommand);

    bind(HelpUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(HelpUI);
    bind(EDITOR_TYPES.DefaultUIElement).toService(HelpUI);

    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
    bind(TYPES.ISnapper).to(CenterGridSnapper);
    bind(DynamicChildrenProcessor).toSelf().inSingletonScope();

    // For some reason the CreateElementAction and Command exist but in no sprotty module is the command registered, so we need to do this here.
    configureCommand(context, CreateElementCommand);

    configureViewerOptions(context, {
        zoomLimits: { min: 0.05, max: 20 },
    });
});
