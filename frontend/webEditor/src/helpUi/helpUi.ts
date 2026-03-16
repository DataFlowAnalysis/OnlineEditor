import { injectable } from "inversify";
import "./helpUi.css";
import { AccordionUiExtension } from "../accordionUiExtension";
import hashJson from "./hash.json";

@injectable()
export class HelpUI extends AccordionUiExtension {
    static readonly ID = "help-ui";

    constructor() {
        super("right", "up");
    }

    id() {
        return HelpUI.ID;
    }

    containerClass() {
        return HelpUI.ID;
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        contentElement.innerHTML = `
            <p><kbd>CTRL</kbd>+<kbd>Space</kbd>: Command Palette</p>
            <p><kbd>CTRL</kbd>+<kbd>Z</kbd>: Undo</p>
            <p><kbd>CTRL</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>: Redo</p>
            <p><kbd>Del</kbd>: Delete selected elements</p>
            <p><kbd>T</kbd>: Toggle Label Type Edit UI</p>
            <p><kbd>CTRL</kbd>+<kbd>O</kbd>: Load diagram from json</p>
            <p><kbd>CTRL</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>: Open default diagram</p>
            <p><kbd>CTRL</kbd>+<kbd>S</kbd>: Save diagram to json</p>
            <p><kbd>CTRL</kbd>+<kbd>L</kbd>: Automatically layout diagram</p>
            <p><kbd>CTRL</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>: Fit diagram to screen</p>
            <p><kbd>CTRL</kbd>+<kbd>C</kbd>: Copy selected elements</p>
            <p><kbd>CTRL</kbd>+<kbd>V</kbd>: Paste previously copied elements</p>
            <p><kbd>Esc</kbd>: Disable current creation tool</p>
            <p>Toggle Creation Tool: Refer to key in the tool palette</p>
        `;

        contentElement.appendChild(this.buildCommitHash());
    }
    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.classList.add("help-accordion-icon");
        headerElement.innerText = "Keyboard Shortcuts | Help";
    }

    private buildCommitHash(): HTMLElement {
        const holder = document.createElement("div");
        holder.id = "hashHolder";
        holder.innerHTML = "Commit:";

        const link = document.createElement("a");
        link.innerHTML = hashJson.hash.substring(0, 6);
        link.href = `https://github.com/DataFlowAnalysis/OnlineEditor/tree/${hashJson.hash}`;
        link.id = "hash";
        link.target = "_blank";

        holder.appendChild(link);
        return holder;
    }
}
