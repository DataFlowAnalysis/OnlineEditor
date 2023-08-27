import { injectable, multiInject } from "inversify";
import { KeyListener, SModelElementImpl } from "sprotty";
import { Action } from "sprotty-protocol";
import { EDITOR_TYPES } from "../../utils";

/**
 * Common interface between all tools used in the data flow diagram editor.
 * These tools are meant to be enabled, allow the user to perform some action like creating a new node or edge,
 * and then they should disable themselves when the action is done.
 * Alternatively they can be disabled from the UI or other code to cancel the tool usage.
 */
export interface DfdTool {
    enable(): void;
    disable(): void;
}

/**
 * Util key listener that disables all registered dfd tools when the escape key is pressed.
 */
@injectable()
export class DfdToolDisableKeyListener extends KeyListener {
    @multiInject(EDITOR_TYPES.DfdTool) protected tools: DfdTool[] = [];

    override keyDown(_element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (event.key === "Escape") {
            this.disableAllTools();
        }

        return [];
    }

    private disableAllTools(): void {
        this.tools.forEach((tool) => tool.disable());
    }
}
