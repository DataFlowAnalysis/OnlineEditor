/** @jsx svg */
import { injectable, inject, multiInject } from "inversify";
import { VNode } from "snabbdom";
import {
    svg,
    AbstractUIExtension,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    TYPES,
    PatcherProvider,
    CommitModelAction,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { NodeCreationTool } from "./nodeCreationTool";
import { EdgeCreationTool } from "./edgeCreationTool";
import { DfdTool } from "./tool";
import { EDITOR_TYPES } from "../../utils";

import "../../common/commonStyling.css";
import "./toolPalette.css";

/**
 * UI extension that adds a tool palette to the diagram in the upper right.
 * Currently this only allows activating the CreateEdgeTool.
 */
@injectable()
export class ToolPaletteUI extends AbstractUIExtension implements IActionHandler {
    static readonly ID = "tool-palette";

    constructor(
        @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher,
        @inject(TYPES.PatcherProvider) protected readonly patcherProvider: PatcherProvider,
        @inject(EdgeCreationTool) protected readonly edgeCreationTool: EdgeCreationTool,
        @inject(NodeCreationTool) protected readonly nodeCreationTool: NodeCreationTool,
        @multiInject(EDITOR_TYPES.DfdTool) protected readonly allTools: DfdTool[],
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
        containerElement.classList.add("ui-float");

        this.addTool(
            containerElement,
            this.nodeCreationTool,
            "Storage node",
            (tool) => tool.enable("node:storage"),
            <g>
                <rect x="10%" y="20%" width="80%" height="60%" stroke-width="1" />
                <text x="50%" y="50%">
                    Sto
                </text>
            </g>,
        );

        this.addTool(
            containerElement,
            this.nodeCreationTool,
            "Input/Output node",
            (tool) => tool.enable("node:input-output"),
            <g>
                <rect x="10%" y="20%" width="80%" height="60%" stroke-width="1" />
                <line x1="25%" y1="20%" x2="25%" y2="80%" stroke-width="1" />
                <text x="55%" y="50%">
                    IO
                </text>
            </g>,
        );

        this.addTool(
            containerElement,
            this.nodeCreationTool,
            "Function node",
            (tool) => tool.enable("node:function"),
            <g>
                <rect x="10%" y="20%" width="80%" height="60%" rx="20%" ry="20%" />
                <line x1="10%" y1="65%" x2="90%" y2="65%" />
                <text x="50%" y="44%">
                    Fun
                </text>
            </g>,
        );

        this.addTool(
            containerElement,
            this.edgeCreationTool,
            "Edge with an arrowhead",
            (tool) => tool.enable(),
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
    private addTool<T extends DfdTool>(
        container: HTMLElement,
        tool: T,
        name: string,
        enable: (tool: T) => void,
        svgCode: VNode,
    ): void {
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
                tool.disable();
                toolElement.classList.remove("active");
            } else {
                // Disable all other tools
                this.disableTools();

                // Enable the selected tool
                enable(tool);

                // Mark the tool as active
                toolElement.classList.add("active");
            }
        });

        container.appendChild(toolElement);
        // When patching the snabbdom vnode into a DOM element, the element is replaced.
        // So we create a dummy sub element inside the tool element and patch the svg node into that.
        // This results in the toolElement holding the content. When patching directly onto the toolElement,
        // it would be replaced by the svg node and the tool class would be removed with it, which we don't want.
        const subElement = document.createElement("div");
        toolElement.appendChild(subElement);
        this.patcherProvider.patcher(subElement, svgNode);
    }

    private disableTools(): void {
        this.allTools.forEach((tool) => tool.disable());
        this.markAllToolsInactive();
    }

    private markAllToolsInactive(): void {
        if (!this.containerElement) return;

        // Remove active class from all tools, resulting in none of the tools being shown as active
        this.containerElement.childNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
                node.classList.remove("active");
            }
        });
    }

    handle(action: Action): void | Action | ICommand {
        // Some change has been made to the model.
        // This may indicate the end of a tool action, so we show all tools to be inactive.
        if (action.kind === CommitModelAction.KIND) {
            this.markAllToolsInactive();
        }
    }
}
