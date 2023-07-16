import { Action } from "sprotty-protocol";
import { ContainsDfdLabels, LabelAssignment, LabelTypeRegistry, containsDfdLabels } from "../labelTypes";
import { Command, CommandExecutionContext, CommandReturn, SModelElement, SParentElement, TYPES } from "sprotty";
import { constructorInject } from "../utils";
import { injectable } from "inversify";

export interface AddLabelAssignmentAction extends Action {
    kind: typeof AddLabelAssignmentAction.TYPE;
    element: ContainsDfdLabels;
    labelAssignment: LabelAssignment;
}
export namespace AddLabelAssignmentAction {
    export const TYPE = "add-label-assignment";
    export function create(element: ContainsDfdLabels, labelAssignment: LabelAssignment): AddLabelAssignmentAction {
        return {
            kind: TYPE,
            element,
            labelAssignment,
        };
    }
}

export class AddLabelAssignmentCommand extends Command {
    public static readonly KIND = AddLabelAssignmentAction.TYPE;
    private hasBeenAdded = false;

    constructor(@constructorInject(TYPES.Action) private action: AddLabelAssignmentAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        // Check whether the element already has a label with the same type and value assigned
        this.hasBeenAdded =
            this.action.element.labels.find((as) => {
                return (
                    as.labelTypeId === this.action.labelAssignment.labelTypeId &&
                    as.labelTypeValueId === this.action.labelAssignment.labelTypeValueId
                );
            }) === undefined;

        if (this.hasBeenAdded) {
            this.action.element.labels.push(this.action.labelAssignment);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;
        const idx = labels.indexOf(this.action.labelAssignment);
        if (idx >= 0 && this.hasBeenAdded) {
            labels.splice(idx, 1);
        }

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

export interface DeleteLabelTypeValueAction extends Action {
    kind: typeof DeleteLabelTypeValueAction.TYPE;
    registry: LabelTypeRegistry;
    labelTypeId: string;
    labelTypeValueId: string;
}
export namespace DeleteLabelTypeValueAction {
    export const TYPE = "delete-label-type-value";
    export function create(
        registry: LabelTypeRegistry,
        labelTypeId: string,
        labelTypeValueId: string,
    ): DeleteLabelTypeValueAction {
        return {
            kind: TYPE,
            registry,
            labelTypeId,
            labelTypeValueId,
        };
    }
}

@injectable()
export class DeleteLabelTypeValueCommand extends Command {
    public static readonly KIND = DeleteLabelTypeValueAction.TYPE;

    constructor(@constructorInject(TYPES.Action) private action: DeleteLabelTypeValueAction) {
        super();
    }

    private removeLabelValueFromGraph(element: SModelElement | SParentElement): void {
        if (containsDfdLabels(element)) {
            element.labels = element.labels.filter((label) => {
                return (
                    label.labelTypeId !== this.action.labelTypeId ||
                    label.labelTypeValueId !== this.action.labelTypeValueId
                );
            });
        }

        if ("children" in element) {
            element.children.forEach((child) => this.removeLabelValueFromGraph(child));
        }
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const labelType = this.action.registry.getLabelType(this.action.labelTypeId);
        if (!labelType) {
            return context.root;
        }

        const labelTypeValue = labelType.values.find((value) => value.id === this.action.labelTypeValueId);
        if (!labelTypeValue) {
            return context.root;
        }

        this.removeLabelValueFromGraph(context.root);

        const index = labelType.values.indexOf(labelTypeValue);
        if (index > -1) {
            labelType.values.splice(index, 1);
            this.action.registry.labelTypeChanged();
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
