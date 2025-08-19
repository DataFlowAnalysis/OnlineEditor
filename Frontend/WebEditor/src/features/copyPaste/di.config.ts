import { ContainerModule } from "inversify";
import { TYPES, configureCommand } from "sprotty";
import { CopyPasteKeyListener } from "./keyListener";
import { PasteElementsCommand } from "./pasteCommand";

/**
 * This feature allows the user to copy and paste elements.
 * When ctrl+c is pressed, all selected elements are copied into an internal array.
 * When ctrl+v is pressed, all elements in the internal array are pasted with an fixed offset.
 * Nodes are copied with their ports and edges are copied if source and target were copied as well.
 */
export const copyPasteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bind(TYPES.KeyListener).to(CopyPasteKeyListener).inSingletonScope();
    configureCommand(context, PasteElementsCommand);
});
