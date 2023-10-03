import { inject, injectable } from "inversify";
import { CommitModelAction, MouseListener, MouseTool, SChildElementImpl, SGraphImpl, SShapeElementImpl } from "sprotty";
import { DfdTool } from "./tool";
import { Action, SPort, SelectAction } from "sprotty-protocol";
import { generateRandomSprottyId } from "../../utils";
import { CreateSnappedElementAction } from "./createSnappedElementCommand";

@injectable()
export class PortCreationTool extends MouseListener implements DfdTool {
    private portType: string = "port:dfd-input";

    constructor(@inject(MouseTool) protected mouseTool: MouseTool) {
        super();
    }

    enable(portType?: string) {
        if (portType) {
            this.portType = portType;
        }
        this.mouseTool.register(this);
    }

    disable(): void {
        this.mouseTool.deregister(this);
    }

    /**
     * Find the node that the port should be created in.
     * This is the node that the user clicked on.
     * If the user clicked on a label or other element that is not a node, we need to find the node that contains this element.
     * If no node is found, undefined is returned.
     */
    private findNodeElement(target: SShapeElementImpl): SShapeElementImpl | undefined {
        if (target.type.startsWith("node")) {
            return target;
        }
        if (target instanceof SChildElementImpl && target.parent instanceof SShapeElementImpl) {
            return this.findNodeElement(target.parent);
        }
        return undefined;
    }

    mouseDown(target: SShapeElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        const node = this.findNodeElement(target);
        if (!node) {
            // We need a node that the port can be created in.
            // It usually cannot be found because the user clicked on the graph root.
            return [];
        }

        const root = target.root as SGraphImpl;

        // Position where the user clicked
        const clickPosition = {
            x: root.scroll.x + event.offsetX / root.zoom,
            y: root.scroll.y + event.offsetY / root.zoom,
        };

        // Create port
        const portSchema = {
            type: this.portType,
            id: generateRandomSprottyId(),
            position: {
                // This position is relative to the node that this port is created in.
                // So we will need to calculate the difference between the click position and the node position.
                x: clickPosition.x - node.position.x,
                y: clickPosition.y - node.position.y,
            },
            size: {
                width: -1,
                height: -1,
            },
        } as SPort;

        // This tool is done and can be disabled. No other ports should be created unless re-enabled.
        this.disable();

        return [
            CreateSnappedElementAction.create(portSchema, node.id),
            CommitModelAction.create(), // Save change to ModelSource
            // Select the newly created port and deselect the node that has been selected because the user clicked on it to initiate the port creation.
            SelectAction.create({
                selectedElementsIDs: [portSchema.id],
                deselectedElementsIDs: [node.id],
            }),
        ];
    }
}
