import { Action } from "sprotty-protocol";
import { ContainsDfdLabels, LabelAssignment } from "../labelTypes";
import { Command, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { constructorInject } from "../utils";

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

    constructor(@constructorInject(TYPES.Action) private action: AddLabelAssignmentAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.action.element.labels.push(this.action.labelAssignment);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const labels = this.action.element.labels;
        const idx = labels.indexOf(this.action.labelAssignment);
        if (idx >= 0) {
            labels.splice(idx, 1);
        }

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
