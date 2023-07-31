import { injectable } from "inversify";
import { constructorInject, generateRandomSprottyId } from "../../utils";
import {
    CommitModelAction,
    EnableDefaultToolsAction,
    LocalModelSource,
    MouseListener,
    MouseTool,
    SGraph,
    TYPES,
    Tool,
} from "sprotty";
import { Action, CreateElementAction } from "sprotty-protocol";
import { DFDNodeSchema } from "../dfdElements/nodes";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";

/**
 * The type and size of the node to be created by the NodeCreationTool.
 */
export interface NodeMetadata {
    type: string;
    height: number;
    width: number;
}

/**
 * Mouse Listener for the NodeCreationTool.
 * Creates a node when the user clicks somewhere on the root graph.
 * The type and size of the node can be configured via the NodeMetadata.
 * Automatically disables itself after creating a node.
 */
@injectable()
export class NodeCreationToolMouseListener extends MouseListener {
    constructor(
        @constructorInject(TYPES.ModelSource) protected modelSource: LocalModelSource,
        @constructorInject(DynamicChildrenProcessor) protected dynamicChildrenProcessor: DynamicChildrenProcessor,
        private nodeMetadata: NodeMetadata = {
            type: "node:storage",
            height: 30,
            width: 70,
        },
    ) {
        super();
    }

    /**
     * Method to set the type and size of the node to be created.
     */
    public setNodeMetadata(nodeMetadata: NodeMetadata) {
        this.nodeMetadata = nodeMetadata;
    }

    override mouseDown(target: SGraph, event: MouseEvent): (Action | Promise<Action>)[] {
        if (target.type !== "graph") {
            // Clicked on some element. Do nothing.
            // We only want to create a node when clicking on the root graph/background.
            return [];
        }

        // Create node
        const nodeSchema = {
            type: this.nodeMetadata.type,
            id: generateRandomSprottyId(),
            text: "Storage",
            position: {
                x: event.screenX,
                y: event.screenY,
            },
            size: {
                width: this.nodeMetadata.width,
                height: this.nodeMetadata.height,
            },
        } as DFDNodeSchema;

        // Adjust the position of the node so that it is centered on the cursor.
        const adjust = (offset: number, size: number) => {
            return offset / target.zoom - size / 2;
        };
        nodeSchema.position = {
            x: target.scroll.x + adjust(event.offsetX, nodeSchema.size?.width ?? 0),
            y: target.scroll.y + adjust(event.offsetY, nodeSchema.size?.height ?? 0),
        };

        // Add any dynamically declared children to the node schema.
        this.dynamicChildrenProcessor.processGraphChildren(nodeSchema, "set");

        return [
            CreateElementAction.create(nodeSchema, { containerId: this.modelSource.model.id }), // Create node
            CommitModelAction.create(), // Save to ModelSource
            EnableDefaultToolsAction.create(), // Disable tool
        ];
    }
}

@injectable()
export class NodeCreationTool implements Tool {
    static ID = "node-creation-tool";

    constructor(
        @constructorInject(MouseTool) protected mouseTool: MouseTool,
        @constructorInject(NodeCreationToolMouseListener)
        protected nodeCreationToolMouseListener: NodeCreationToolMouseListener,
    ) {}

    get id(): string {
        return NodeCreationTool.ID;
    }

    enable(): void {
        this.mouseTool.register(this.nodeCreationToolMouseListener);
    }

    disable(): void {
        this.mouseTool.deregister(this.nodeCreationToolMouseListener);
    }
}
