/** @jsx svg */
import { ContainerModule, injectable } from "inversify";
import { init, attributesModule, VNode } from "snabbdom";
import {
    svg,
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

const patch = init([attributesModule]);

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
            NodeCreationTool.ID,
            "Storage node",
            () =>
                this.nodeCreationToolMouseListener.setNodeMetadata({
                    type: "node:storage",
                    height: 30,
                    width: 60,
                }),
            <g>
                <line x1="10%" y1="20%" x2="90%" y2="20%" stroke-width="1" />
                <line x1="10%" y1="80%" x2="90%" y2="80%" stroke-width="1" />
                <text x="50%" y="53%">
                    Sto
                </text>
            </g>,
        );

        this.addTool(
            containerElement,
            NodeCreationTool.ID,
            "Input/Output node",
            () =>
                this.nodeCreationToolMouseListener.setNodeMetadata({
                    type: "node:input-output",
                    height: 40,
                    width: 70,
                }),
            <g>
                <rect x="10%" y="20%" width="80%" height="60%" stroke-width="1" />
                <text x="50%" y="53%">
                    IO
                </text>
            </g>,
        );

        this.addTool(
            containerElement,
            NodeCreationTool.ID,
            "Function node",
            () =>
                this.nodeCreationToolMouseListener.setNodeMetadata({
                    type: "node:function",
                    height: 50,
                    width: 50,
                }),
            <g>
                <circle cx="50%" cy="50%" r="40%" stroke-width="1" />
                <text x="50%" y="53%">
                    Fun
                </text>
            </g>,
        );

        this.addTool(
            containerElement,
            EdgeCreationTool.ID,
            "Edge with an arrowhead",
            () => {},
            <g>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="2" orient="auto">
                        <polygon points="0 0, 4 2, 0 4" />
                    </marker>
                </defs>

                <line x1="10%" y1="10%" x2="75%" y2="75%" attrs-stroke-width="2" attrs-marker-end="url(#arrowhead)" />
            </g>,
        );

        containerElement.classList.add("tool-palette");
    }

    /**
     * Utility function that adds a tool to the tool palette.
     *
     * @param container the base container html element of the tool palette
     * @param toolId the id of the sprotty tool that should be activated when the tool is clicked
     * @param name the name of the tool that is displayed as a alt text/tooltip
     * @param clicked callback that is called when the tool is clicked. Can be used to configure the calling tool
     * @param svgCode vnode for the svg logo of the tool. Will be placed in a 32x32 svg element
     */
    private addTool(container: HTMLElement, toolId: string, name: string, clicked: () => void, svgCode: VNode): void {
        const toolElement = document.createElement("div");
        toolElement.classList.add("tool");
        const svgNode = (
            <svg width="32" height="32">
                <title>{name}</title>
                {svgCode}
            </svg>
        );

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
        // When patching the snabbdom vnode into a DOM element, the element is replaced.
        // So we create a dummy sub element inside the tool element and patch the svg node into that.
        // This results in the toolElement holding the content. When patching directly onto the toolElement,
        // it would be replaced by the svg node and the tool class would be removed with it, which we don't want.
        const subElement = document.createElement("div");
        toolElement.appendChild(subElement);
        patch(subElement, svgNode);
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
