import { ContainerModule } from "inversify";
import { DeleteKeyListener } from "./deleteKeyListener";
import { CenterKeyboardListener, configureCommand, TYPES } from "sprotty";
import { CopyPasteKeyListener, PasteElementsCommand } from "./copyPasteKeyListener";
import { SerializeKeyListener } from "./serializeKeyListener";
import { FitToScreenKeyListener } from "./fitToScreenKeyListener";

export const keyListenerModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(DeleteKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(DeleteKeyListener);

    const context = { bind, unbind, isBound, rebind };
    bind(TYPES.KeyListener).to(CopyPasteKeyListener).inSingletonScope();
    configureCommand(context, PasteElementsCommand);

    bind(TYPES.KeyListener).to(SerializeKeyListener).inSingletonScope();

    bind(FitToScreenKeyListener).toSelf().inSingletonScope();
    rebind(CenterKeyboardListener).toService(FitToScreenKeyListener);
});
