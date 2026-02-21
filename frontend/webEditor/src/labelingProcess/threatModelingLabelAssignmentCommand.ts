import { Action } from "sprotty-protocol";
import { injectable, inject } from "inversify";
import { Command, CommandExecutionContext, CommandReturn, IActionDispatcher, SNodeImpl, TYPES } from "sprotty";
import { ContainsDfdLabels } from "../labels/feature.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { LabelingProcessState, LabelingProcessUi } from "./labelingProcessUi.ts";
import { ExcludesDialog } from "./excludesDialog.ts";
import {
    isThreatModelingLabelType,
    isThreatModelingLabelTypeValue,
    ThreatModelingLabelType,
    ThreatModelingLabelTypeValue,
} from "../labels/ThreatModelingLabelType.ts";
import { AddLabelAssignmentAction, RemoveLabelAssignmentAction } from "../labels/assignmentCommand.ts";
import { DfdNodeImpl } from "../diagram/nodes/common.ts";

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
            kind: ThreatModelingLabelAssignmentCommand.KIND,
            element,
            collisionMode: collisionMode ?? 'askUser'
        };
    }
}

@injectable()
export class ThreatModelingLabelAssignmentCommand implements Command {
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
            this.handleSimpleCase(labelProcessState)
            return context.root;
        }

        const possibleCollisions = this.action.element.labels
            .map(label => this.labelTypeRegistry.resolveLabelAssignment(label))
            .filter((label) : label is Required<{ labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }> =>
                label.labelType !== undefined
                && label.labelTypeValue !== undefined
            )
            .filter(label =>
                    isThreatModelingLabelType(label.labelType)
                    && isThreatModelingLabelTypeValue(label.labelTypeValue)
            )
        const collisions = findCollisions({ labelType, labelTypeValue }, possibleCollisions )

        if (collisions.length == 0) {
            this.handleSimpleCase(labelProcessState)
        } else if (this.action.collisionMode === "askUser") {
            this.handleAskUser(
                { labelType, labelTypeValue },
                collisions,
                context
            )
        } else {
            this.handleOverwrite(labelProcessState, collisions)
        }

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        // Do nothing since only simple case and overwrite case would need to be redone.
        // Both these cases work by calling other commands.
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // Do nothing since only simple case and overwrite case would need to be undone.
        // Both these cases work by calling other commands.
        return context.root;
    }

    private handleSimpleCase(
        labelProcessState: LabelingProcessState & { state: "inProgress" },
    ) {
        this.actionDispatcher.dispatch(AddLabelAssignmentAction.create(
            labelProcessState.activeLabel,
            this.action.element,
        ))
        if (this.action.element instanceof DfdNodeImpl) {
            this.action.element.setColor(LabelingProcessUi.ALREADY_ASSIGNED_COLOR)
        }
    }

    private handleAskUser(
        candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
        collisions: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[],
        context: CommandExecutionContext
    ) {
        this.excludesDialog.update({
            previousLabelAssignments: collisions ,
            newLabelAssignment: candidate,
            confirmAction: AddThreatModelingLabelToNodeAction.create(this.action.element, "overwrite")
        })

        this.excludesDialog.show(context.root);
    }

    private handleOverwrite(
        labelProcessState: LabelingProcessState & { state: "inProgress" },
        collisions: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[]
    ) {
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
        if (this.action.element instanceof DfdNodeImpl) {
            this.action.element.setColor(LabelingProcessUi.ALREADY_ASSIGNED_COLOR)
        }
    }
}

export function findCollisions(
    candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
    assigned: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[]
): { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[] {
    return assigned.filter(existing =>
        candidate.labelTypeValue.excludes.some(exclude =>
            exclude.labelTypeId === existing.labelType.id
            && exclude.labelTypeValueId === existing.labelTypeValue.id
        )
        || existing.labelTypeValue.excludes.some(exclude =>
            exclude.labelTypeId === candidate.labelType.id
            && exclude.labelTypeValueId === candidate.labelTypeValue.id
        )
    )
}