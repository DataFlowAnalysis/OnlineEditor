import {
    CommitModelAction,
    DeleteElementAction,
    KeyListener,
    SModelElementImpl,
    isDeletable,
    isSelectable,
    SConnectableElementImpl,
    SRoutableElementImpl,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";

/**
 * Custom sprotty key listener that deletes all selected elements when the user presses the delete key.
 */
export class DeleteKeyListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "Delete")) {
            const index = element.root.index;
            const selectedElements = Array.from(
                index
                    .all()
                    .filter((e) => isDeletable(e) && isSelectable(e) && e.selected)
                    .filter((e) => e.id !== e.root.id), // Deleting the model root would be a bad idea
            );

            const deleteElementIds = selectedElements.flatMap((e) => {
                if (e instanceof SConnectableElementImpl) {
                    // This element can be connected to other elements, so we need to delete all edges connected to it as well.
                    // Otherwise the edges would be left dangling in the graph.
                    const getEdgeId = (edge: SRoutableElementImpl) => edge.id;
                    return [...e.incomingEdges.map(getEdgeId), ...e.outgoingEdges.map(getEdgeId), e.id];
                } else {
                    // This element cannot be connected to anything, so we can just delete it
                    return [e.id];
                }
            });

            if (deleteElementIds.length > 0) {
                const uniqueIds = [...new Set(deleteElementIds)];

                return [DeleteElementAction.create(uniqueIds), CommitModelAction.create()];
            }
        }
        return [];
    }
}
