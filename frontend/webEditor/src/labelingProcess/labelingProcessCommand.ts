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
import { isThreatModelingLabelType } from "../labels/ThreatModelingLabelType.ts";
import { getAllElements } from "../labels/assignmentCommand.ts";
import { DfdNodeImpl } from "../diagram/nodes/common.ts";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort.tsx";

export interface LabelingProcessAction extends Action {
    state: LabelingProcessState
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
    public static readonly HIGHLIGHT_COLOR = '#00FF00'

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
        if (this.action.state.state !== "inProgress") return context.root;

        const { labelType } = this.labelTypeRegistry.resolveLabelAssignment(this.action.state.activeLabel)
        if (!labelType) return;

        let nodeColor = ""
        let outputPortColor = ""
        if (!isThreatModelingLabelType(labelType)) {
            nodeColor = LabelingProcessCommand.HIGHLIGHT_COLOR
            outputPortColor = LabelingProcessCommand.HIGHLIGHT_COLOR
        } else if (labelType.intendedFor === "Vertex") {
            nodeColor = LabelingProcessCommand.HIGHLIGHT_COLOR
            outputPortColor = DfdOutputPortImpl.PORT_COLOR
        } else {
            nodeColor = DfdNodeImpl.NODE_COLOR
            outputPortColor = DfdOutputPortImpl.PORT_COLOR
        }

        getAllElements(context.root.children)
            .filter((element) => element instanceof DfdNodeImpl)
            .forEach(node => node.setColor(nodeColor))

        getAllElements(context.root.children)
            .filter((element) => element instanceof DfdOutputPortImpl)
            .forEach(port => port.setColor(outputPortColor))
    }

}