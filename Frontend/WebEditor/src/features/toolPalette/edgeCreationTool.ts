import { injectable } from "inversify";
import { isConnectable, SChildElementImpl, SEdgeImpl, SModelElementImpl } from "sprotty";
import { Action, SEdge } from "sprotty-protocol";
import { generateRandomSprottyId } from "../../utils";
import { CreationTool } from "./creationTool";

@injectable()
export class EdgeCreationTool extends CreationTool<SEdge, SEdgeImpl> {
    // Pseudo element that is used as a target for the edge while it is being created
    private edgeTargetElement?: SChildElementImpl;

    createElementSchema(): SEdge {
        return {
            id: generateRandomSprottyId(),
            type: "edge:arrow",
            sourceId: "",
            targetId: "",
        };
    }

    disable(): void {
        if (this.edgeTargetElement) {
            // Pseudo edge target element must always be removed
            // regardless of whether the edge creation was successful or cancelled
            this.element?.root.remove(this.edgeTargetElement);
            this.edgeTargetElement = undefined;
        }

        super.disable();
    }

    mouseDown(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (!this.element) {
            // This shouldn't happen
            return [];
        }

        if (!isConnectable(target)) {
            // Nothing can be connected to this element, invalid choice
            return [];
        }

        if (this.element.source) {
            // Source already set, so we're setting the target now

            if (target.canConnect(this.element, "target")) {
                this.element.targetId = target.id;

                // super: Finalize creation and disable the tool
                return super.mouseDown(target, event);
            }
        } else {
            // Source not set yet, so we're setting the source now

            if (target.canConnect(this.element, "source")) {
                this.element.sourceId = target.id;

                // Create a new target element
                // For previewing the edge it must be able to be rendered
                // which means source and target *must* be set even though
                // we don't know the target yet.
                // To work around this we create a dummy target element
                // that is snapped to the current mouse position.
                // It is a SPort because a normal node
                this.edgeTargetElement = this.modelFactory.createElement({
                    id: generateRandomSprottyId(),
                    type: "empty-node",
                });
                // Add empty node to the graph and as a edge target
                this.element.root.add(this.edgeTargetElement);
                this.element.targetId = this.edgeTargetElement.id;
            }
        }

        // Trigger re-rendering of the edge
        this.commandStack.update(this.element.root);
        return [];
    }
}
