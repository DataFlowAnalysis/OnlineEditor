import { CommitModelAction, KeyListener, SModelElementImpl } from "sprotty";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { Action } from "sprotty-protocol";
import { LayoutModelAction } from "./command";
import { DefaultFitToScreenAction } from "../fitToScreen/action";
import { LayoutMethod } from "./layoutMethod";

export class AutoLayoutKeyListener extends KeyListener {
    keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyL", "ctrlCmd")) {
            event.preventDefault();

            return [
                LayoutModelAction.create(LayoutMethod.LINES),
                CommitModelAction.create(),
                DefaultFitToScreenAction.create(element.root),
            ];
        }

        return [];
    }
}
