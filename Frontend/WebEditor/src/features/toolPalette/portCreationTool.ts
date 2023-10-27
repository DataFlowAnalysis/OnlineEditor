import { injectable } from "inversify";
import { CommitModelAction, SChildElementImpl, SModelElementImpl, SPortImpl, SShapeElementImpl } from "sprotty";
import { Action, SPort } from "sprotty-protocol";
import { generateRandomSprottyId } from "../../utils";
import { CreationTool } from "./creationTool";

@injectable()
export class PortCreationTool extends CreationTool<SPort, SPortImpl> {
    private portType: string = "port:dfd-input";

    enable(portType?: string): void {
        if (portType) {
            this.portType = portType;
        }

        super.enable();
    }

    createElementSchema(): SPort {
        return {
            id: generateRandomSprottyId(),
            type: this.portType,
        };
    }

    mouseMove(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        if (!this.element) {
            return [];
        }

        const currentParent = this.element.parent;
        const targetNode = this.findNodeElement(target);

        if (targetNode) {
            // We're hovering over a node, add the port to the node (if not already)
            if (currentParent !== targetNode && target instanceof SChildElementImpl) {
                this.element.opacity = this.previewOpacity;
                currentParent.remove(this.element);
                target.add(this.element);
                this.commandStack.update(this.element.root);
            }
        } else {
            // We're not hovering over a node.
            // Add the port to the root graph (if not already) and hide it.
            if (currentParent !== target.root) {
                this.element.opacity = 0;
                currentParent.remove(this.element);
                target.root.add(this.element);
                this.commandStack.update(this.element.root);
            }
        }

        return super.mouseMove(target, event);
    }

    mouseDown(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (this.element?.parent === target.root) {
            this.disable();
            // Run some action to re-render the tool palette ui
            // showing that the tool is disabled
            return [CommitModelAction.create()];
        }

        return super.mouseDown(target, event);
    }

    private findNodeElement(target: SModelElementImpl): SModelElementImpl | undefined {
        if (target.type.startsWith("node")) {
            return target;
        }
        if (target instanceof SChildElementImpl && target.parent instanceof SShapeElementImpl) {
            return this.findNodeElement(target.parent);
        }
        return undefined;
    }
}
