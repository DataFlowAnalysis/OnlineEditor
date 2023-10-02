import { injectable, inject } from "inversify";
import { generateRandomSprottyId } from "../../utils";
import { CommitModelAction, LocalModelSource, MouseListener, MouseTool, SGraphImpl, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { DfdNodeImpl, DfdNode } from "../dfdElements/nodes";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { DfdTool } from "./tool";
import { CreateSnappedElementAction } from "./createSnappedElementCommand";

/**
 * Creates a node when the user clicks somewhere on the root graph.
 * The type and size of the node can be configured via the NodeMetadata.
 * Automatically disables itself after creating a node.
 */
@injectable()
export class NodeCreationTool extends MouseListener implements DfdTool {
    constructor(
        @inject(TYPES.ModelSource) protected modelSource: LocalModelSource,
        @inject(MouseTool) protected mouseTool: MouseTool,
        @inject(DynamicChildrenProcessor) protected dynamicChildrenProcessor: DynamicChildrenProcessor,
        private nodeType = "node:storage",
    ) {
        super();
    }

    /**
     * Method to enable the tool and optionally select the type of node to be created.
     * If no type is given the default type/previous set type is used.
     */
    enable(nodeType?: string) {
        if (nodeType) {
            this.nodeType = nodeType;
        }
        this.mouseTool.register(this);
    }

    disable(): void {
        this.mouseTool.deregister(this);
    }

    override mouseDown(target: SGraphImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        if (target.type !== "graph") {
            // Clicked on some element. Do nothing.
            // We only want to create a node when clicking on the root graph/background.
            return [];
        }

        // Create node
        let text = this.nodeType.replace("node:", "");
        text = text.charAt(0).toUpperCase() + text.slice(1); // Capitalize first letter

        const nodeSchema = {
            type: this.nodeType,
            id: generateRandomSprottyId(),
            text: text,
            position: {
                x: event.screenX,
                y: event.screenY,
            },
            size: {
                width: -1,
                height: -1,
            },
        } as DfdNode;

        // Adjust the position of the node so that it is centered on the cursor.
        const adjust = (offset: number, size: number) => {
            return offset / target.zoom - size / 2;
        };
        nodeSchema.position = {
            x: target.scroll.x + adjust(event.offsetX, DfdNodeImpl.DEFAULT_WIDTH),
            y: target.scroll.y + adjust(event.offsetY, 30),
        };

        // Add any dynamically declared children to the node schema.
        this.dynamicChildrenProcessor.processGraphChildren(nodeSchema, "set");

        // This tool is done and can be disabled. No other nodes should be created unless re-enabled.
        this.disable();

        return [
            CreateSnappedElementAction.create(nodeSchema, target.id), // Create node and snap it to grid
            CommitModelAction.create(), // Save to ModelSource
        ];
    }
}
