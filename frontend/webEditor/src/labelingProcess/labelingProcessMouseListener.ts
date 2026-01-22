import { MouseListener, SModelElementImpl, SNodeImpl } from "sprotty";
import { Action } from "sprotty-protocol/lib/actions";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort.tsx";
import { inject } from "inversify";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { AddLabelToOutputPortAction } from "./outputPortAssignmentCommand.ts";
import { containsDfdLabels } from "../labels/feature";
import { getParentWithDfdLabels } from "../labels/dragAndDrop.ts";
import { AddThreatModelingLabelToNodeAction } from "./threatModelingAssignmentCommand.ts";

export class LabelingProcessMouseListener extends MouseListener {

    constructor(
        @inject(LabelingProcessUi) private readonly labelingProcessUi: LabelingProcessUi
    ) {
        super();
    }

    override contextMenu(target: SModelElementImpl): Action[] {
        //Only do this while the labeling process is in progress
        const processState = this.labelingProcessUi.getState();
        if (processState.state !== "inProgress") return [];

        // Adds label to Output Port
        if (target instanceof DfdOutputPortImpl) {
            return [AddLabelToOutputPortAction.create(target)]
        }

        // Adds label to nodes
        const dfdLabelElement = getParentWithDfdLabels(target);
        if (!dfdLabelElement) return []
        if (containsDfdLabels(dfdLabelElement)) {
            if (!(dfdLabelElement instanceof SNodeImpl)) return [];

            return [AddThreatModelingLabelToNodeAction.create(dfdLabelElement)]
        }

        return []
    }
}