import { ContainerModule, injectable } from "inversify";
import {
    MouseListener,
    MouseTool,
    Tool,
    SModelElement,
    isConnectable,
    SEdge,
    EnableDefaultToolsAction,
    SChildElement,
    CommitModelAction,
} from "sprotty";
import { Action, CreateElementAction, SEdge as SEdgeSchema, SLabel as SLabelSchema } from "sprotty-protocol";
import { EDITOR_TYPES, constructorInject, generateRandomSprottyId } from "../utils";

@injectable()
export class EdgeCreationToolMouseListener extends MouseListener {
    private source?: SModelElement;
    private target?: SModelElement;

    constructor(private edgeType: string = "edge:arrow") {
        super();
    }

    reinitialize(): void {
        this.source = undefined;
        this.target = undefined;
    }

    override mouseDown(target: SModelElement, _event: MouseEvent): Action[] {
        // First click selects the source (if valid source element)
        // Second click selects the target and creates the edge (if valid target element)
        const element = this.findConnectableElement(target);
        if (!element) return [];

        if (this.source === undefined) {
            return this.sourceClick(element);
        } else {
            return this.targetClick(element);
        }
    }

    /**
     * A graph node may contain other elements (e.g. labels).
     * The user may click on this but they want to add a edge to the parent node.
     * To find the parent node that is intended we recursively go up the parent chain until we find a connectable element.
     * If none is found we return undefined. In this case the whole element is not connectable.
     */
    private findConnectableElement(element: SModelElement): SModelElement | undefined {
        if (isConnectable(element)) {
            return element;
        } else if (element instanceof SChildElement) {
            return this.findConnectableElement(element.parent);
        } else {
            return undefined;
        }
    }

    private sourceClick(element: SModelElement): Action[] {
        if (this.canConnect(element, "source")) {
            this.source = element;
        }
        return [];
    }

    private targetClick(element: SModelElement): Action[] {
        if (this.source && this.source.id !== element.id && this.canConnect(element, "target")) {
            // Add edge to diagram
            this.target = element;
            const edge = {
                type: this.edgeType,
                id: generateRandomSprottyId(),
                sourceId: this.source.id,
                targetId: this.target.id,
                children: [
                    {
                        type: "label",
                        id: generateRandomSprottyId(),
                        text: "",
                        edgePlacement: {
                            position: 0.5,
                            side: "on",
                            rotate: false,
                        },
                    } as SLabelSchema,
                ],
            } as SEdgeSchema;

            return [
                // Disables the EdgeCreationTool and only enables the default tools
                EnableDefaultToolsAction.create(),
                // Create the new edge
                CreateElementAction.create(edge, {
                    containerId: this.source.root.id,
                }),
                CommitModelAction.create(),
            ];
        }
        return [];
    }

    private canConnect(element: SModelElement, type: "source" | "target"): boolean {
        if (type === "target" && element.id === this.source?.id) {
            // Cannot connect to itself
            return false;
        }

        // Construct pseudo edge to check if it can be connected
        const edge = new SEdge();
        edge.type = "edge:arrow";
        if (this.source) edge.sourceId = this.source.id;
        if (this.target) edge.targetId = this.target.id;

        return isConnectable(element) && element.canConnect(edge, type);
    }
}

@injectable()
export class EdgeCreationTool implements Tool {
    static ID = "edge-creation-tool";

    constructor(
        @constructorInject(MouseTool) protected mouseTool: MouseTool,
        @constructorInject(EdgeCreationToolMouseListener)
        protected edgeCreationToolMouseListener: EdgeCreationToolMouseListener,
    ) {}

    get id(): string {
        return EdgeCreationTool.ID;
    }

    enable(): void {
        this.edgeCreationToolMouseListener.reinitialize();
        this.mouseTool.register(this.edgeCreationToolMouseListener);
    }

    disable(): void {
        this.mouseTool.deregister(this.edgeCreationToolMouseListener);
    }
}

export const edgeCreationTool = new ContainerModule((bind) => {
    bind(EdgeCreationToolMouseListener).toSelf().inSingletonScope();
    bind(EdgeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.ITool).toService(EdgeCreationTool);
});
