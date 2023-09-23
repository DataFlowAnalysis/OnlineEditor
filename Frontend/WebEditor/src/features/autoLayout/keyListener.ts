import { CommitModelAction, KeyListener, SModelElementImpl } from "sprotty";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { Action, FitToScreenAction } from "sprotty-protocol";
import { LayoutModelAction } from "./command";
import { FIT_TO_SCREEN_PADDING } from "../../utils";

export class AutoLayoutKeyListener extends KeyListener {
    keyDown(_element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyL", "ctrlCmd")) {
            event.preventDefault();

            return [
                LayoutModelAction.create(),
                CommitModelAction.create(),
                FitToScreenAction.create(
                    [], // empty elementIds means fit the whole diagram
                    { padding: FIT_TO_SCREEN_PADDING },
                ),
            ];
        }

        return [];
    }
}
