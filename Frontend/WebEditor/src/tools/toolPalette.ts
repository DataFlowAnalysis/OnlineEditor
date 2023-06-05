import { ContainerModule, injectable } from "inversify";
import {
    AbstractUIExtension,
    EnableDefaultToolsAction,
    EnableToolsAction,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    TYPES,
    configureActionHandler,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { constructorInject } from "../utils";
import { EdgeCreationTool } from "./edgeCreationTool";

import "./toolPalette.css";

/**
 * UI extension that adds a tool palette to the diagram in the upper right.
 * Currently this only allows activating the CreateEdgeTool.
 */
@injectable()
export class ToolPaletteUI extends AbstractUIExtension implements IActionHandler {
    static readonly ID = "tool-palette";

    constructor(@constructorInject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher) {
        super();
    }

    id(): string {
        return ToolPaletteUI.ID;
    }

    containerClass(): string {
        return "tool-palette";
    }

    protected initializeContents(containerElement: HTMLElement): void {
        const arrowEdgeElement = document.createElement("div");
        arrowEdgeElement.classList.add("tool");
        arrowEdgeElement.innerHTML = `
        <svg width="32" height="32">

        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="0" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" />
            </marker>
        </defs>

        <line x1="10%" y1="10%" x2="75%" y2="75%"
                stroke="black" stroke-width="2"
                marker-end="url(#arrowhead)" />
        </svg>
        `;

        arrowEdgeElement.addEventListener("click", () => {
            if (arrowEdgeElement.classList.contains("active")) {
                // Already activated => disable the tool
                this.disableEdgeCreationTool();
            } else {
                arrowEdgeElement.classList.toggle("active");
                this.enableEdgeCreationTool();
            }
        });
        containerElement.appendChild(arrowEdgeElement);
        containerElement.classList.add("tool-palette");
    }

    private enableEdgeCreationTool(): void {
        this.actionDispatcher.dispatch(EnableToolsAction.create([EdgeCreationTool.ID]));
    }

    private disableEdgeCreationTool(): void {
        this.actionDispatcher.dispatch(EnableDefaultToolsAction.create());
    }

    handle(action: Action): void | Action | ICommand {
        // Unsets all active classes of the tool icons when all non-default tools are disabled
        if (action.kind === EnableDefaultToolsAction.KIND) {
            this.containerElement.childNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    node.classList.remove("active");
                }
            });
        }
    }
}

export const toolPaletteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bind(ToolPaletteUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ToolPaletteUI);
    configureActionHandler(context, EnableDefaultToolsAction.KIND, ToolPaletteUI);
});
