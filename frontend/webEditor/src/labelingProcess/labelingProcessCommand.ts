import { inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    TYPES,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { LabelingProcessState, LabelingProcessUi } from "./labelingProcessUi.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { LabelAssignment } from "../labels/LabelType.ts";
import {
    isThreatModelingLabelType,
    isThreatModelingLabelTypeValue,
    ThreatModelingLabelType, ThreatModelingLabelTypeValue,
} from "../labels/ThreatModelingLabelType.ts";
import { getAllElements } from "../labels/assignmentCommand.ts";
import { DfdNodeImpl } from "../diagram/nodes/common.ts";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort.tsx";
import { findCollisions as findNodeCollisions } from "./threatModelingLabelAssignmentCommand.ts";
import { findCollisions as findOutputPortCollisions } from "./threatModelingLabelAssignmentToOutputPortCommand.ts";

export interface LabelingProcessAction extends Action {
    state: LabelingProcessState
}

export namespace ResetLabelingProcessAction {
    export function create(): LabelingProcessAction {
        return {
            kind: LabelingProcessCommand.KIND,
            state: { state: 'pending' }
        }
    }
}

export namespace BeginLabelingProcessAction {
    export function create(
        labelTypeRegistry: LabelTypeRegistry
    ): LabelingProcessAction {
        const allLabels = labelTypeRegistry.getAllLabelAssignments()

        return {
            kind: LabelingProcessCommand.KIND,
            state: {
                state: 'inProgress',
                finishedLabels: [],
                activeLabel: allLabels [0]
            }
        }
    }
}

export namespace NextLabelingProcessAction {
    export function create(
        labelTypeRegistry: LabelTypeRegistry,
        finishedLabels: LabelAssignment[]
    ): LabelingProcessAction {
        const pendingLabels = labelTypeRegistry.getAllLabelAssignments()
            .filter(
                (label) => !finishedLabels.some(
                    finishedLabel => finishedLabel.labelTypeId === label.labelTypeId && finishedLabel.labelTypeValueId === label.labelTypeValueId
                )
            )

        if (pendingLabels.length === 0) return CompleteLabelingProcessAction.create();

        return {
            kind: LabelingProcessCommand.KIND,
            state: {
                state: 'inProgress',
                finishedLabels: finishedLabels,
                activeLabel: pendingLabels[0]
            }
        }
    }
}

export namespace CompleteLabelingProcessAction {
    export function create(): LabelingProcessAction {
        return {
            kind: LabelingProcessCommand.KIND,
            state: {
                state: 'done',
            }
        }
    }
}

@injectable()
export class LabelingProcessCommand implements Command {

    public static readonly KIND = "labelingProcess"

    private previousState?: LabelingProcessState = undefined;

    constructor(
        @inject(TYPES.Action) private readonly action: LabelingProcessAction,
        @inject(LabelingProcessUi) private readonly ui: LabelingProcessUi,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        this.previousState = this.ui.getState();

        this.ui.setState(this.action.state);
        this.highlightShapes(context);

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.previousState) {
            this.ui.setState(this.previousState);
            this.highlightShapes(context);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        this.ui.setState(this.action.state);
        this.highlightShapes(context);
        return context.root;
    }

    highlightShapes(context: CommandExecutionContext) {
        if (this.action.state.state !== "inProgress") return;

        const { labelType, labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(this.action.state.activeLabel)
        if (!labelType || !labelTypeValue) return;


        const applyColorToNode = (node: DfdNodeImpl) => {
            if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) {
                node.setColor(LabelingProcessUi.ASSIGNABLE_COLOR)
                return;
            }

            if (labelType.intendedFor !== "Vertex") {
                node.setColor(DfdNodeImpl.NODE_COLOR)
                return;
            }

            const assignedLabels = node.labels
                .map(label => this.labelTypeRegistry.resolveLabelAssignment(label))
                .filter((label) : label is Required<{ labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }> =>
                    label.labelType !== undefined
                    && label.labelTypeValue !== undefined
                )
                .filter(label =>
                    isThreatModelingLabelType(label.labelType)
                    && isThreatModelingLabelTypeValue(label.labelTypeValue)
                )
            if (findNodeCollisions({ labelType, labelTypeValue }, assignedLabels).length === 0) {
                node.setColor(LabelingProcessUi.ASSIGNABLE_COLOR)
            } else {
                node.setColor(LabelingProcessUi.COLLISION_COLOR)
            }
        }

        const applyColorToOutputPort = (port: DfdOutputPortImpl) => {
            if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) {
                port.setColor(LabelingProcessUi.ASSIGNABLE_COLOR)
                return;
            }

            if (labelType.intendedFor !== "Flow") {
                port.setColor(DfdOutputPortImpl.PORT_COLOR)
                return;
            }

            const behavior = port.getBehavior().split("\n")
            if (findOutputPortCollisions(behavior, { labelType, labelTypeValue }, this.labelTypeRegistry).length === 0) {
                port.setColor(LabelingProcessUi.ASSIGNABLE_COLOR)
            } else {
                port.setColor(LabelingProcessUi.COLLISION_COLOR)
            }
        }

        getAllElements(context.root.children)
            .filter((element) => element instanceof DfdNodeImpl)
            .forEach(applyColorToNode)

        getAllElements(context.root.children)
            .filter((element) => element instanceof DfdOutputPortImpl)
            .forEach(applyColorToOutputPort)
    }

}