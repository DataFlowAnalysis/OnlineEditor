import { CommitModelAction, KeyListener, SModelElementImpl } from "sprotty";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { Action } from "sprotty-protocol";
import { LayoutModelAction } from "./command";
import { createDefaultFitToScreenAction } from "../../utils";
import { LayoutMethod } from "../settingsMenu/LayoutMethod";

export class AutoLayoutKeyListener extends KeyListener {
    keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyL", "ctrlCmd")) {
            event.preventDefault();

            return [
                LayoutModelAction.create(LayoutMethod.LINES),
                CommitModelAction.create(),
                createDefaultFitToScreenAction(element.root),
            ];
        }

        return [];
    }
}
