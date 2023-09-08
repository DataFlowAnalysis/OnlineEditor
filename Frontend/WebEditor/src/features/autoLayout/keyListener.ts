import { CommitModelAction, KeyListener, SModelElementImpl } from "sprotty";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { Action, FitToScreenAction } from "sprotty-protocol";
import { LayoutModelAction } from "./command";
import { FIT_TO_SCREEN_PADDING } from "../../utils";

export class AutoLayoutKeyListener extends KeyListener {
    keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyL", "ctrl")) {
            event.preventDefault();

            return [
                LayoutModelAction.create(),
                CommitModelAction.create(),
                FitToScreenAction.create(
                    element.root.children.map((child) => child.id), // Fit screen to all children
                    { padding: FIT_TO_SCREEN_PADDING },
                ),
            ];
        }

        return [];
    }
}
