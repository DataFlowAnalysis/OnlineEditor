import { Action } from "sprotty-protocol";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    ISnapper,
    SModelElementImpl,
    SNodeImpl,
    SParentElementImpl,
    TYPES,
} from "sprotty";
import { injectable, inject } from "inversify";
import { ContainsDfdLabels, containsDfdLabels } from "./elementFeature";
import { LabelAssignment, LabelTypeRegistry } from "./labelTypeRegistry";
import { snapPortsOfNode } from "../dfdElements/portSnapper";

export interface AddLabelAssignmentAction extends Action {
    kind: typeof AddLabelAssignmentAction.TYPE;
    element: ContainsDfdLabels & SNodeImpl;
    labelAssignment: LabelAssignment;
}
export namespace AddLabelAssignmentAction {
    export const TYPE = "add-label-assignment";
    export function create(
        element: ContainsDfdLabels & SNodeImpl,
        labelAssignment: LabelAssignment,
    ): AddLabelAssignmentAction {
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

    constructor(
        @inject(TYPES.Action) private action: AddLabelAssignmentAction,
        @inject(TYPES.ISnapper) private snapper: ISnapper,
    ) {
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

        snapPortsOfNode(this.action.element, this.snapper);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;
        const idx = labels.indexOf(this.action.labelAssignment);
        if (idx >= 0 && this.hasBeenAdded) {
            labels.splice(idx, 1);
        }

        snapPortsOfNode(this.action.element, this.snapper);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

export interface DeleteLabelAssignmentAction extends Action {
    kind: typeof DeleteLabelAssignmentAction.TYPE;
    element: ContainsDfdLabels & SNodeImpl;
    labelAssignment: LabelAssignment;
}
export namespace DeleteLabelAssignmentAction {
    export const TYPE = "delete-label-assignment";
    export function create(
        element: ContainsDfdLabels & SNodeImpl,
        labelAssignment: LabelAssignment,
    ): DeleteLabelAssignmentAction {
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

    constructor(
        @inject(TYPES.Action) private action: DeleteLabelAssignmentAction,
        @inject(TYPES.ISnapper) private snapper: ISnapper,
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;

        const idx = labels.indexOf(this.action.labelAssignment);
        if (idx >= 0) {
            labels.splice(idx, 1);
        }

        snapPortsOfNode(this.action.element, this.snapper);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;
        labels.push(this.action.labelAssignment);

        snapPortsOfNode(this.action.element, this.snapper);
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
    element: SModelElementImpl | SParentElementImpl,
    snapper: ISnapper,
    predicate: (type: LabelAssignment) => boolean,
): void {
    if (containsDfdLabels(element)) {
        const filteredLabels = element.labels.filter(predicate);
        if (filteredLabels.length !== element.labels.length) {
            element.labels = filteredLabels;
            if (containsDfdLabels(element) && element instanceof SNodeImpl) {
                snapPortsOfNode(element, snapper);
            }
        }
    }

    if ("children" in element) {
        element.children.forEach((child) => removeLabelsFromGraph(child, snapper, predicate));
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

    constructor(
        @inject(TYPES.Action) private action: DeleteLabelTypeValueAction,
        @inject(TYPES.ISnapper) private snapper: ISnapper,
    ) {
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

        removeLabelsFromGraph(context.root, this.snapper, (label) => {
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

    constructor(
        @inject(TYPES.Action) private action: DeleteLabelTypeAction,
        @inject(TYPES.ISnapper) private snapper: ISnapper,
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const labelType = this.action.registry.getLabelType(this.action.labelTypeId);
        if (!labelType) {
            return context.root;
        }

        removeLabelsFromGraph(context.root, this.snapper, (label) => label.labelTypeId !== this.action.labelTypeId);
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
