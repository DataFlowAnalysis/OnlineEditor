import { injectable } from "inversify";
import { MouseListener, SModelElementImpl, SetUIExtensionVisibilityAction } from "sprotty";
import { Action } from "sprotty-protocol";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort";
import { AssignmentEditUi } from "./AssignmentEditUi";

/**
 * Detects when a dfd output port is double clicked and shows the OutputPortEditUI
 * with the clicked port as context element.
 */
@injectable()
export class OutputPortEditUIMouseListener extends MouseListener {
    private editUIVisible = false;

    mouseDown(target: SModelElementImpl): (Action | Promise<Action>)[] {
        if (this.editUIVisible) {
            // The user has clicked somewhere on the sprotty diagram (not the port edit UI)
            // while the UI was open. In this case we hide the UI.
            // This may not be exactly accurate because the UI can close itself when
            // the change was saved but in those cases editUIVisible is still true.
            // However hiding it one more time here for those cases is not a problem.
            // Because it is already hidden, nothing will happen and after one click
            // editUIVisible will be false again.
            this.editUIVisible = false;
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: AssignmentEditUi.ID,
                    visible: false,
                    contextElementsId: [target.id],
                }),
            ];
        }

        return [];
    }

    doubleClick(target: SModelElementImpl): (Action | Promise<Action>)[] {
        console.debug(target.type)
        if (target instanceof DfdOutputPortImpl) {
            // The user has double clicked on a dfd output port
            // => show the OutputPortEditUI for this port.
            this.editUIVisible = true;
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: AssignmentEditUi.ID,
                    visible: true,
                    contextElementsId: [target.id],
                }),
            ];
        }

        return [];
    }
}