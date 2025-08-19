import {
    CommitModelAction,
    KeyListener,
    SModelElementImpl,
    isDeletable,
    isSelectable,
    SConnectableElementImpl,
    SChildElementImpl,
} from "sprotty";
import { Action, DeleteElementAction } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";

/**
 * Custom sprotty key listener that deletes all selected elements when the user presses the delete key.
 */
export class DeleteKeyListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "Delete")) {
            return this.deleteSelectedElements(element);
        }
        return [];
    }

    private deleteSelectedElements(element: SModelElementImpl): Action[] {
        const index = element.root.index;
        const selectedElements = Array.from(
            index
                .all()
                .filter((e) => isDeletable(e) && isSelectable(e) && e.selected)
                .filter((e) => e.id !== e.root.id), // Deleting the model root would be a bad idea
        );

        const deleteElementIds = selectedElements.flatMap((e) => {
            const ids = [e.id];

            if (e instanceof SConnectableElementImpl) {
                // This element can be connected to other elements, so we need to delete all edges connected to it as well.
                // Otherwise the edges would be left dangling in the graph.
                ids.push(...this.getEdgeIdsOfElement(e));
            }
            if (e instanceof SChildElementImpl) {
                // Add all children and their edges to the list of elements to delete
                // This is needed when the edges are not connected to the element itself but to a port of the element.
                e.children.forEach((child) => {
                    ids.push(child.id);
                    if (child instanceof SConnectableElementImpl) {
                        ids.push(...this.getEdgeIdsOfElement(child));
                    }
                });
            }

            return ids;
        });

        if (deleteElementIds.length > 0) {
            const uniqueIds = [...new Set(deleteElementIds)];

            return [DeleteElementAction.create(uniqueIds), CommitModelAction.create()];
        } else {
            return [];
        }
    }

    private getEdgeIdsOfElement(element: SConnectableElementImpl): string[] {
        return [...element.incomingEdges.map((e) => e.id), ...element.outgoingEdges.map((e) => e.id)];
    }
}
