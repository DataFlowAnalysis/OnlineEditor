import { Action } from "sprotty-protocol";
import { injectable, inject } from "inversify";
import { Command, CommandExecutionContext, CommandReturn, IActionDispatcher, SNodeImpl, TYPES } from "sprotty";
import { ContainsDfdLabels } from "../labels/feature.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { ExcludesDialog } from "./excludesDialog.ts";
import {
    isThreatModelingLabelType,
    isThreatModelingLabelTypeValue,
    ThreatModelingLabelType,
    ThreatModelingLabelTypeValue,
} from "../labels/ThreatModelingLabelType.ts";
import { AddLabelAssignmentAction, RemoveLabelAssignmentAction } from "../labels/assignmentCommand.ts";

interface ThreatModelingLabelAssignmentToNodeAction extends Action {
    element: ContainsDfdLabels & SNodeImpl;
    collisionMode: 'overwrite' | 'askUser'
}

export namespace AddThreatModelingLabelToNodeAction {
    export function create(
        element: ContainsDfdLabels & SNodeImpl,
        collisionMode?: 'overwrite' | 'askUser'
    ): ThreatModelingLabelAssignmentToNodeAction {
        return {
            kind: ThreatModelingAssignmentCommand.KIND,
            element,
            collisionMode: collisionMode ?? 'askUser'
        };
    }
}

@injectable()
export class ThreatModelingAssignmentCommand implements Command {
    public static readonly KIND = "threatModeling-addLabelToNode";

    constructor(
        @inject(TYPES.Action) private readonly action: ThreatModelingLabelAssignmentToNodeAction,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(LabelingProcessUi) private readonly labelingProcessUI: LabelingProcessUi,
        @inject(ExcludesDialog) private readonly excludesDialog: ExcludesDialog,
        @inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        const labelProcessState = this.labelingProcessUI.getState()
        if (labelProcessState.state !== "inProgress") return context.root;

        const { labelType, labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(labelProcessState.activeLabel)
        if (!labelType || !labelTypeValue) return context.root;

        if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) {
            this.actionDispatcher.dispatch(AddLabelAssignmentAction.create(
                labelProcessState.activeLabel,
                this.action.element,
            ))
            return context.root;
        }

        const collisions = this.action.element.labels
            .map(label => this.labelTypeRegistry.resolveLabelAssignment(label))
            .filter(assignedLabel => {
                if (!assignedLabel.labelType
                    || !assignedLabel.labelTypeValue
                    || !isThreatModelingLabelType(assignedLabel.labelType)
                    || !isThreatModelingLabelTypeValue(assignedLabel.labelTypeValue)
                ) {
                    return false;
                }

                // Does a previously assigned label exclude the new label?
                if (!assignedLabel.labelTypeValue.excludes.some(
                    (exclude) =>
                        exclude.labelTypeId === labelType.id
                        && exclude.labelTypeValueId === labelTypeValue.id
                )) {
                    return true;
                }

                // Does the new label exclude the previously assigned label?
                if (labelTypeValue.excludes.some(
                    (exclude) =>
                        exclude.labelTypeId === assignedLabel.labelType?.id
                        && exclude.labelTypeValueId === assignedLabel.labelTypeValue?.id
                )) {
                    return true;
                }

                return false;
            }) as { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[]
        //     ^ Assignments that are partial or are of the wrong type are filtered out above.
        //     Typescript does not recognize that the filter ensures that the array only contains the correct types.
        //     Therefore, we need to cast the array to the correct type.

        console.error(collisions)

        if (collisions.length == 0) {
            this.actionDispatcher.dispatch(AddLabelAssignmentAction.create(
                labelProcessState.activeLabel,
                this.action.element,
            ))
            return context.root;
        }

        if (this.action.collisionMode === "askUser") {
            this.excludesDialog.update({
                previousLabelAssignments: collisions,
                newLabelAssignment: { labelType, labelTypeValue },
                confirmAction: AddThreatModelingLabelToNodeAction.create(this.action.element, "overwrite")
            })
            this.excludesDialog.show(context.root);

            return context.root
        }

        //this.action.collisionMode === "overwrite"
        for (const collision of collisions) {
            this.actionDispatcher.dispatch(RemoveLabelAssignmentAction.create(
                { labelTypeId: collision.labelType.id, labelTypeValueId: collision.labelTypeValue.id },
                this.action.element,
            ))
        }
        this.actionDispatcher.dispatch(AddLabelAssignmentAction.create(
            labelProcessState.activeLabel,
            this.action.element,
        ))

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.action.collisionMode === "askUser") return context.root;

        return context.root;
    }
}