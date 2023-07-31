import { AbstractUIExtension } from "sprotty";
import { injectable } from "inversify";

import "./helpUi.css";

@injectable()
export class HelpUI extends AbstractUIExtension {
    static readonly ID = "help-ui";

    id(): string {
        return HelpUI.ID;
    }

    containerClass(): string {
        return HelpUI.ID;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");
        containerElement.innerHTML = `
            <div>
                <p><kbd>CTRL</kbd>+<kbd>Space</kbd>: Command Palette</p>
                <p><kbd>CTRL</kbd>+<kbd>Z</kbd>: Undo</p>
                <p><kbd>CTRL</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>: Redo</p>
                <p><kbd>Del</kbd>: Delete selected elements</p>
            </div>
        `;
    }
}
