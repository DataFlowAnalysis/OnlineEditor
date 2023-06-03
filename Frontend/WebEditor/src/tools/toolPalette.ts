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

import "./toolPalette.css";
import { constructorInject } from "../utils";
import { EdgeCreationTool } from "./edgeCreationTool";

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
                this.actionDispatcher.dispatch(EnableDefaultToolsAction.create());
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

    handle(action: Action): void | Action | ICommand {
        if (action.kind === EnableDefaultToolsAction.KIND) {
            // Recursively remove the active class from all tools
            const removeActiveClass = (element: HTMLElement) => {
                element.classList.remove("active");
                element.childNodes.forEach((child) => {
                    if (child instanceof HTMLElement) {
                        removeActiveClass(child);
                    }
                });
            };
            removeActiveClass(this.containerElement);
        }
    }
}

export const toolPaletteModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bind(ToolPaletteUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(ToolPaletteUI);
    configureActionHandler(context, EnableDefaultToolsAction.KIND, ToolPaletteUI);
});
