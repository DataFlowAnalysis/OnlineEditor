import { inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    TYPES,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { LabelingProcessState, LabelingProcessUi, LabelTypeValueWithLabelType } from "./labelingProcessUi.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { LabelType } from "../labels/LabelType.ts";

export interface LabelingProcessAction extends Action {
    state: LabelingProcessState
}

export namespace BeginLabelingProcessAction {
    export function create(
        labelTypeRegistry: LabelTypeRegistry
    ): LabelingProcessAction {
        const allLabels = transformLabelTypeArray(labelTypeRegistry.getLabelTypes())

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
        finishedLabels: LabelTypeValueWithLabelType[]
    ): LabelingProcessAction {
        const pendingLabels = transformLabelTypeArray(labelTypeRegistry.getLabelTypes())
            .filter(
                (label) => !finishedLabels.some(
                    finishedLabel => finishedLabel.labelType === label.labelType && finishedLabel.labelTypeValue === label.labelTypeValue
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

function transformLabelTypeArray(labelTypes: LabelType[]): LabelTypeValueWithLabelType[] {
    const transformed: LabelTypeValueWithLabelType[] = []
    for (const labelType of labelTypes) {
        for (const labelTypeValue of labelType.values) {
            transformed.push({ labelType, labelTypeValue });
        }
    }
    return transformed;
}

@injectable()
export class LabelingProcessCommand implements Command {

    public static readonly KIND = "labelingProcess"

    constructor(
        @inject(TYPES.Action) private readonly action: LabelingProcessAction,
        @inject(LabelingProcessUi) private readonly ui: LabelingProcessUi
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        this.ui.setState(this.action.state)
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

}