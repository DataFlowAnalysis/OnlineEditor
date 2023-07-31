import { Action } from "sprotty-protocol";
import { Command, CommandExecutionContext, CommandReturn, SModelElement, SParentElement, TYPES } from "sprotty";
import { constructorInject } from "../../utils";
import { injectable } from "inversify";
import { ContainsDfdLabels, containsDfdLabels } from "./elementFeature";
import { LabelAssignment, LabelTypeRegistry } from "./labelTypeRegistry";

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

@injectable()
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

export interface DeleteLabelAssignmentAction extends Action {
    kind: typeof DeleteLabelAssignmentAction.TYPE;
    element: ContainsDfdLabels;
    labelAssignment: LabelAssignment;
}
export namespace DeleteLabelAssignmentAction {
    export const TYPE = "delete-label-assignment";
    export function create(element: ContainsDfdLabels, labelAssignment: LabelAssignment): DeleteLabelAssignmentAction {
        return {
            kind: TYPE,
            element,
            labelAssignment,
        };
    }
}

@injectable()
export class DeleteLabelAssignmentCommand extends Command {
    public static readonly KIND = DeleteLabelAssignmentAction.TYPE;

    constructor(@constructorInject(TYPES.Action) private action: DeleteLabelAssignmentAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;

        const idx = labels.indexOf(this.action.labelAssignment);
        if (idx >= 0) {
            labels.splice(idx, 1);
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;
        labels.push(this.action.labelAssignment);

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Recursively traverses the sprotty diagram graph and removes all labels that match the given predicate.
 * @param predicate a function deciding whether the label assignment should be kept
 */
function removeLabelsFromGraph(
    element: SModelElement | SParentElement,
    predicate: (type: LabelAssignment) => boolean,
): void {
    if (containsDfdLabels(element)) {
        element.labels = element.labels.filter(predicate);
    }

    if ("children" in element) {
        element.children.forEach((child) => removeLabelsFromGraph(child, predicate));
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

    execute(context: CommandExecutionContext): CommandReturn {
        const labelType = this.action.registry.getLabelType(this.action.labelTypeId);
        if (!labelType) {
            return context.root;
        }

        const labelTypeValue = labelType.values.find((value) => value.id === this.action.labelTypeValueId);
        if (!labelTypeValue) {
            return context.root;
        }

        removeLabelsFromGraph(context.root, (label) => {
            return (
                label.labelTypeId !== this.action.labelTypeId || label.labelTypeValueId !== this.action.labelTypeValueId
            );
        });

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

export interface DeleteLabelTypeAction extends Action {
    kind: typeof DeleteLabelTypeAction.TYPE;
    registry: LabelTypeRegistry;
    labelTypeId: string;
}
export namespace DeleteLabelTypeAction {
    export const TYPE = "delete-label-type";
    export function create(registry: LabelTypeRegistry, labelTypeId: string): DeleteLabelTypeAction {
        return {
            kind: TYPE,
            registry,
            labelTypeId,
        };
    }
}

@injectable()
export class DeleteLabelTypeCommand extends Command {
    public static readonly KIND = DeleteLabelTypeAction.TYPE;

    constructor(@constructorInject(TYPES.Action) private action: DeleteLabelTypeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const labelType = this.action.registry.getLabelType(this.action.labelTypeId);
        if (!labelType) {
            return context.root;
        }

        removeLabelsFromGraph(context.root, (label) => label.labelTypeId !== this.action.labelTypeId);
        this.action.registry.unregisterLabelType(labelType);

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
