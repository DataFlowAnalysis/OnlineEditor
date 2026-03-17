import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    ISnapper,
    isSelected,
    SChildElementImpl,
    SModelElementImpl,
    SNodeImpl,
    TYPES,
} from "sprotty";
import { LabelAssignment } from "./LabelType";
import { Action } from "sprotty-protocol";
import { snapPortsOfNode } from "../diagram/ports/portSnapper";
import { EditorModeController } from "../settings/editorMode";
import { inject, injectable } from "inversify";
import { SETTINGS } from "../settings/Settings";
import { ContainsDfdLabels, containsDfdLabels } from "./feature";

interface LabelAssignmentAction extends Action {
    action: "add" | "remove";
    element?: ContainsDfdLabels & SNodeImpl;
    labelAssignment: LabelAssignment;
}

export namespace AddLabelAssignmentAction {
    export function create(
        labelAssignment: LabelAssignment,
        element?: ContainsDfdLabels & SNodeImpl,
    ): LabelAssignmentAction {
        return {
            kind: LabelAssignmentCommand.KIND,
            action: "add",
            labelAssignment,
            element,
        };
    }
}

export namespace RemoveLabelAssignmentAction {
    export function create(
        labelAssignment: LabelAssignment,
        element?: ContainsDfdLabels & SNodeImpl,
    ): LabelAssignmentAction {
        return {
            kind: LabelAssignmentCommand.KIND,
            action: "remove",
            labelAssignment,
            element,
        };
    }
}

@injectable()
export class LabelAssignmentCommand implements Command {
    public static readonly KIND = "labelAction";

    private elements?: ContainsDfdLabels[];

    constructor(
        @inject(TYPES.Action) private readonly action: LabelAssignmentAction,
        @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController,
        @inject(TYPES.ISnapper) private readonly snapper: ISnapper,
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController.isReadOnly()) {
            return context.root;
        }
        if (this.action.element) {
            this.elements = [this.action.element];
        } else {
            const allElements = getAllElements(context.root.children);
            this.elements = allElements.filter((element) => isSelected(element) && containsDfdLabels(element));
        }

        if (this.action.action == "add") {
            this.addLabel();
        } else {
            this.removeLabel();
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController.isReadOnly()) {
            return context.root;
        }

        if (this.action.action == "add") {
            this.removeLabel();
        } else {
            this.addLabel();
        }

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController.isReadOnly()) {
            return context.root;
        }

        if (this.action.action == "add") {
            this.addLabel();
        } else {
            this.removeLabel();
        }

        return context.root;
    }

    private addLabel() {
        this.elements?.forEach((element) => {
            const hasBeenAdded =
                element.labels.find((as) => {
                    return (
                        as.labelTypeId === this.action.labelAssignment.labelTypeId &&
                        as.labelTypeValueId === this.action.labelAssignment.labelTypeValueId
                    );
                }) !== undefined;
            if (!hasBeenAdded) {
                element.labels.push(this.action.labelAssignment);
                if (element instanceof SNodeImpl) {
                    snapPortsOfNode(element, this.snapper);
                }
            }
        });
    }

    private removeLabel() {
        this.elements?.forEach((element) => {
            const labels = element.labels;
            const idx = labels.findIndex(
                (l) =>
                    l.labelTypeId == this.action.labelAssignment.labelTypeId &&
                    l.labelTypeValueId == this.action.labelAssignment.labelTypeValueId,
            );
            if (idx >= 0) {
                labels.splice(idx, 1);
                if (element instanceof SNodeImpl) {
                    snapPortsOfNode(element, this.snapper);
                }
            }
        });
    }
}

export function getAllElements(elements: readonly SChildElementImpl[]): SModelElementImpl[] {
    const elementsList: SModelElementImpl[] = [];
    for (const element of elements) {
        elementsList.push(element);
        if ("children" in element) {
            elementsList.push(...getAllElements(element.children));
        }
    }
    return elementsList;
}
