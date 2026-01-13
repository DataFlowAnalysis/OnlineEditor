import { Action } from "sprotty-protocol";
import { Command, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { inject, injectable } from "inversify";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort.tsx";
import { isThreatModelingLabelType, isThreatModelingLabelTypeValue } from "../labels/ThreatModelingLabelType.ts";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";


interface ThreatModelingLabelAssignmentToOutputPortAction extends Action {
    element: DfdOutputPortImpl;
}

export namespace AddLabelToOutputPortAction {
    export function create(
        element: DfdOutputPortImpl,
    ): ThreatModelingLabelAssignmentToOutputPortAction {
        return {
            kind: OutputPortAssignmentCommand.KIND,
            element
        };
    }
}

@injectable()
export class OutputPortAssignmentCommand implements Command {
    public static readonly KIND = "addLabelToOutputPort";

    private previousBehavior?: string
    private newBehavior?: string

    constructor(
        @inject(TYPES.Action) private readonly action: ThreatModelingLabelAssignmentToOutputPortAction,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(LabelingProcessUi) private readonly labelingProcessUI: LabelingProcessUi
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        const labelProcessState = this.labelingProcessUI.getState()
        if (labelProcessState.state !== "inProgress") return context.root;

        const { labelType, labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(labelProcessState.activeLabel)
        if (!labelType || !labelTypeValue) return context.root;

        this.previousBehavior = this.action.element.getBehavior()
        if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) {
            this.newBehavior = `${this.previousBehavior}\nset ${labelType.name}.${labelTypeValue.text}`
        } else {
            const regex = /forward\s+([a-zA-Z0-9|\s]+)/;
            const match = this.previousBehavior.match(regex);

            this.newBehavior = match ? match[0] : "";
            this.newBehavior += "\n";
            this.newBehavior += labelTypeValue.defaultPinBehavior.replace("{forward}", "");
        }

        this.action.element.setBehavior(this.newBehavior);

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (!this.newBehavior) return context.root;

        this.action.element.setBehavior(this.newBehavior);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (!this.previousBehavior) return context.root;

        this.action.element.setBehavior(this.previousBehavior);
        return context.root;
    }
}