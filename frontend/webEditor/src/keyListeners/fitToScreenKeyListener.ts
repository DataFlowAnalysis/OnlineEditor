import { KeyListener, SModelElementImpl } from "sprotty";
import { Action, CenterAction, FitToScreenAction } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";

/**
 * Key listener that fits the diagram to the screen when pressing Ctrl+Shift+F
 * and centers the diagram when pressing Ctrl+Shift+C.
 *
 * Custom version of the CenterKeyboardListener from sprotty because that one
 * does not allow setting a padding.
 */
export class FitToScreenKeyListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyC", "ctrlCmd", "shift")) {
            return [CenterAction.create([])];
        }

        if (matchesKeystroke(event, "KeyF", "ctrlCmd", "shift")) {
            return [FitToScreenAction.create([element.root.id])];
        }

        return [];
    }
}
