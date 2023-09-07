import { injectable } from "inversify";
import { KeyListener, SModelElementImpl } from "sprotty";
import { Action } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { LoadDefaultDiagramAction } from "./loadDefaultDiagram";
import { LoadDiagramAction } from "./load";
import { SaveDiagramAction } from "./save";

@injectable()
export class SerializeKeyListener extends KeyListener {
    keyDown(_element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyO", "ctrl")) {
            // Prevent the browser file open dialog from opening
            event.preventDefault();

            return [LoadDiagramAction.create()];
        } else if (matchesKeystroke(event, "KeyO", "ctrl", "shift")) {
            event.preventDefault();
            return [LoadDefaultDiagramAction.create()];
        } else if (matchesKeystroke(event, "KeyS", "ctrl")) {
            event.preventDefault();
            return [SaveDiagramAction.create()];
        }

        return [];
    }

    keyUp(_element: SModelElementImpl, _event: KeyboardEvent): Action[] {
        return [];
    }
}
