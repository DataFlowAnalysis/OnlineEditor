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
import { NodeCreationTool, NodeCreationToolMouseListener } from "./nodeCreationTool";

import "./toolPalette.css";

/**
 * UI extension that adds a tool palette to the diagram in the upper right.
 * Currently this only allows activating the CreateEdgeTool.
 */
@injectable()
export class ToolPaletteUI extends AbstractUIExtension implements IActionHandler {
    static readonly ID = "tool-palette";

    constructor(
        @constructorInject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher,
        @constructorInject(NodeCreationToolMouseListener)
        protected nodeCreationToolMouseListener: NodeCreationToolMouseListener,
    ) {
        super();
    }

    id(): string {
        return ToolPaletteUI.ID;
    }

    containerClass(): string {
        // The container element gets this class name by the sprotty base class.
        return "tool-palette";
    }

    /**
     * This method creates the sub elements of the tool palette.
     * This is called by the sprotty base class after creating the container element.
     */
    protected initializeContents(containerElement: HTMLElement): void {
        this.addTool(
            containerElement,
            `
            <line x1="10%" y1="20%" x2="90%" y2="20%" stroke-width="1" />
            <line x1="10%" y1="80%" x2="90%" y2="80%" stroke-width="1" />
            <text x="50%" y="53%">Sto</text>
        `,
            () =>
                this.nodeCreationToolMouseListener.setNodeMetadata({
                    type: "node:storage",
                    height: 30,
                    width: 60,
                }),
            NodeCreationTool.ID,
        );

        this.addTool(
            containerElement,
            `
            <rect x="10%" y="20%" width="80%" height="60%" stroke-width="1" />
            <text x="50%" y="53%">IO</text>
        `,
            () =>
                this.nodeCreationToolMouseListener.setNodeMetadata({
                    type: "node:input-output",
                    height: 40,
                    width: 70,
                }),
            NodeCreationTool.ID,
        );

        this.addTool(
            containerElement,
            `
            <circle cx="50%" cy="50%" r="40%" stroke-width="1" />
            <text x="50%" y="53%">Fun</text>
        `,
            () =>
                this.nodeCreationToolMouseListener.setNodeMetadata({
                    type: "node:function",
                    height: 50,
                    width: 50,
                }),
            NodeCreationTool.ID,
        );

        this.addTool(
            containerElement,
            `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="0" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" />
            </marker>
        </defs>

        <line x1="10%" y1="10%" x2="75%" y2="75%"
                stroke-width="2" marker-end="url(#arrowhead)" />
        `,
            () => {},
            EdgeCreationTool.ID,
        );

        containerElement.classList.add("tool-palette");
    }

    /**
     * Utility function that adds a tool to the tool palette.
     *
     * @param container the base container html element of the tool palette
     * @param svgCode code for the svg logo of the tool. Will be placed in a 32x32 svg element
     * @param clicked callback that is called when the tool is clicked. Can be used to configure the calling tool
     * @param toolId the id of the sprotty tool that should be activated when the tool is clicked
     */
    private addTool(container: HTMLElement, svgCode: string, clicked: () => void, toolId: string): void {
        const toolElement = document.createElement("div");
        toolElement.classList.add("tool");
        toolElement.innerHTML = `
        <svg width="32" height="32">
            ${svgCode}
        </svg>`;

        toolElement.addEventListener("click", () => {
            if (toolElement.classList.contains("active")) {
                // Disabling all tools will trigger a re-render of the tool palette
                // so we don't need to remove the active class here
                this.disableTools();
            } else {
                // Remove active class from all other tools
                container.childNodes.forEach((node) => {
                    if (node instanceof HTMLElement && node !== toolElement) {
                        node.classList.remove("active");
                    }
                });

                toolElement.classList.add("active");
                clicked();
                this.enableTool(toolId);
            }
        });

        container.appendChild(toolElement);
    }

    private enableTool(id: string): void {
        this.actionDispatcher.dispatch(EnableToolsAction.create([id]));
    }

    private disableTools(): void {
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
