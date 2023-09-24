import { injectable, inject } from "inversify";
import {
    MouseListener,
    MouseTool,
    isConnectable,
    SEdgeImpl,
    CommitModelAction,
    SModelElementImpl,
    SChildElementImpl,
} from "sprotty";
import { Action, CreateElementAction, SEdge } from "sprotty-protocol";
import { generateRandomSprottyId } from "../../utils";
import { DfdTool } from "./tool";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";

@injectable()
export class EdgeCreationTool extends MouseListener implements DfdTool {
    private source?: SModelElementImpl;
    private target?: SModelElementImpl;

    constructor(
        @inject(MouseTool) private mouseTool: MouseTool,
        @inject(DynamicChildrenProcessor) private dynamicChildrenProcessor: DynamicChildrenProcessor,
        private edgeType: string = "edge:arrow",
    ) {
        super();
    }

    enable(): void {
        this.source = undefined;
        this.target = undefined;
        this.mouseTool.register(this);
    }

    disable(): void {
        this.mouseTool.deregister(this);
    }

    override mouseDown(target: SModelElementImpl, _event: MouseEvent): Action[] {
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
    private findConnectableElement(element: SModelElementImpl): SModelElementImpl | undefined {
        if (isConnectable(element)) {
            return element;
        } else if (element instanceof SChildElementImpl) {
            return this.findConnectableElement(element.parent);
        } else {
            return undefined;
        }
    }

    private sourceClick(element: SModelElementImpl): Action[] {
        if (this.canConnect(element, "source")) {
            this.source = element;
        }
        return [];
    }

    private targetClick(element: SModelElementImpl): Action[] {
        if (this.source && this.source.id !== element.id && this.canConnect(element, "target")) {
            // Add edge to diagram
            this.target = element;
            const edge = {
                type: this.edgeType,
                id: generateRandomSprottyId(),
                sourceId: this.source.id,
                targetId: this.target.id,
            } as SEdge;
            this.dynamicChildrenProcessor.processGraphChildren(edge, "set");

            // Disable this tool. When another edge should be created, the user has to enable it again.
            this.disable();

            return [
                // Create the new edge
                CreateElementAction.create(edge, {
                    containerId: this.source.root.id,
                }),
                // Save to model
                CommitModelAction.create(),
            ];
        }
        return [];
    }

    private canConnect(element: SModelElementImpl, type: "source" | "target"): boolean {
        if (type === "target" && element.id === this.source?.id) {
            // Cannot connect to itself
            return false;
        }

        // Construct pseudo edge to check if it can be connected
        const edge = new SEdgeImpl();
        edge.type = "edge:arrow";
        if (this.source) edge.sourceId = this.source.id;
        if (this.target) edge.targetId = this.target.id;

        return isConnectable(element) && element.canConnect(edge, type);
    }
}
