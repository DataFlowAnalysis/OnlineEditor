import { Action } from "sprotty-protocol";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    TYPES,
} from "sprotty";
import { inject, injectable } from "inversify";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort.tsx";
import {
    isThreatModelingLabelType,
    isThreatModelingLabelTypeValue,
    ThreatModelingLabelType,
    ThreatModelingLabelTypeValue,
} from "../labels/ThreatModelingLabelType.ts";
import { LabelingProcessUi } from "./labelingProcessUi.ts";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { ExcludesDialog } from "./excludesDialog.ts";


interface ThreatModelingLabelAssignmentToOutputPortAction extends Action {
    element: DfdOutputPortImpl;
    collisionMode: 'overwrite' | 'askUser'
}

export namespace AddLabelToOutputPortAction {
    export function create(
        element: DfdOutputPortImpl,
        collisionMode?: 'overwrite' | 'askUser'
    ): ThreatModelingLabelAssignmentToOutputPortAction {
        return {
            kind: ThreatModelingLabelAssignmentToOutputPortCommand.KIND,
            element,
            collisionMode: collisionMode ?? 'askUser'
        };
    }
}

@injectable()
export class ThreatModelingLabelAssignmentToOutputPortCommand implements Command {
    public static readonly KIND = "addLabelToOutputPort";

    private previousBehavior?: string
    private newBehavior?: string

    constructor(
        @inject(TYPES.Action) private readonly action: ThreatModelingLabelAssignmentToOutputPortAction,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(LabelingProcessUi) private readonly labelingProcessUI: LabelingProcessUi,
        @inject(ExcludesDialog) private readonly excludesDialog: ExcludesDialog
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        const labelProcessState = this.labelingProcessUI.getState()
        if (labelProcessState.state !== "inProgress") return context.root;

        const { labelType, labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(labelProcessState.activeLabel)
        if (!labelType || !labelTypeValue) return context.root;

        this.previousBehavior = this.action.element.getBehavior().trim()
        if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) {
            this.applyNewBehavior([
                `${this.previousBehavior}`,
                `set ${labelType.name}.${labelTypeValue.text}`
            ])
            return context.root;
        }

        const lines = this.previousBehavior
            .split("\n")
            .map(line => line.trim());
        const collisions = findCollisions(lines, { labelType, labelTypeValue }, this.labelTypeRegistry)

        if (collisions.length == 0) {
            this.handleSimpleCase(lines, { labelType, labelTypeValue })
        } else if (this.action.collisionMode === "askUser") {
            this.handleAskUser({ labelType, labelTypeValue }, collisions, context)
        } else {
            this.handleOverwrite(lines, { labelType, labelTypeValue }, collisions)
        }

        return context.root
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (!this.newBehavior
            || this.action.collisionMode === "askUser"
        ) return context.root;

        this.action.element.setBehavior(this.newBehavior);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (!this.previousBehavior
            || this.action.collisionMode === "askUser"
        ) return context.root;

        this.action.element.setBehavior(this.previousBehavior);
        return context.root;
    }

    private handleSimpleCase(
        lines: string[],
        candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
    ) {
        lines = addLabelAssignment(lines, candidate, this.labelTypeRegistry)
        this.applyNewBehavior(lines)
    }

    private handleAskUser(
        candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
        collisions: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[],
        context: CommandExecutionContext
    ) {
        this.excludesDialog.update({
            previousLabelAssignments: collisions,
            newLabelAssignment: candidate,
            confirmAction: AddLabelToOutputPortAction.create(this.action.element, "overwrite")
        })
        this.excludesDialog.show(context.root);
    }

    private handleOverwrite(
        lines: string[],
        candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
        collisions: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[],
    ) {
        for (const collision of collisions) {
            lines = removeLabelAssignment(lines, { labelType: collision.labelType, labelTypeValue: collision.labelTypeValue })
        }
        lines = addLabelAssignment(lines, candidate, this.labelTypeRegistry)
        this.applyNewBehavior(lines)
    }

    private applyNewBehavior(lines: string[]) {
        this.newBehavior = lines
            .filter(line => line !== '')
            .join("\n")
        this.action.element.setBehavior(this.newBehavior);
        this.action.element.setColor(LabelingProcessUi.ALREADY_ASSIGNED_COLOR)
    }
}

export function findCollisions(
    portBehavior: string[],
    candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
    labelTypeRegistry: LabelTypeRegistry
): { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[] {
    //Prevents duplicate entries.
    //Native JS Sets cannot compare { labelType, labelTypeValue } correctly, therefore this complex solution is required.
    const collisions = new Map<
        string,
        { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }
    >();
    const computeCompositeKey = (
        labelType: ThreatModelingLabelType,
        labelTypeValue: ThreatModelingLabelTypeValue
    ) => `${labelType.id}.${labelTypeValue.id}`

    for (let i = 0; i < portBehavior.length; i++) {
        const line = portBehavior[i]

        //Search for a previous assignment that excludes the new assignment
        if (line.trim() === `unset ${candidate.labelType.name}.${candidate.labelTypeValue.text}`) {
            //Searches for the previous `set` assignment
            //Assumes that each `set` assignment is directly followed by its `unset` assignments (based on it's
            //'excludes' property)
            for (let j = i; j >= 0; j--) {
                if (portBehavior[j].startsWith(`set`)) {
                    const parts = portBehavior[j].split(" ")
                    const label = parts[1]
                    const [ labelTypeName, labelTypeValueText ] = label.split(".")

                    const labelType = labelTypeRegistry.getLabelTypes()
                        .find((labelType) => labelType.name === labelTypeName)
                    if (!labelType) continue;

                    const labelTypeValue = labelType.values
                        .find((labelTypeValue) => labelTypeValue.text === labelTypeValueText)
                    if (!labelTypeValue) continue;

                    if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) continue;

                    collisions.set(
                        computeCompositeKey(labelType, labelTypeValue),
                        { labelType, labelTypeValue }
                    )
                }
            }
        }

        //Search for a previous assignment that is excluded by the new assignment
        for (const exclude of candidate.labelTypeValue.excludes) {
            const { labelType, labelTypeValue } = labelTypeRegistry.resolveLabelAssignment(exclude);
            if (
                !labelType
                || !labelTypeValue
                || !isThreatModelingLabelType(labelType)
                || !isThreatModelingLabelTypeValue(labelTypeValue)
            ) continue;

            if (line.trim() === `set ${labelType.name}.${labelTypeValue.text}`) {
                collisions.set(
                    computeCompositeKey(labelType, labelTypeValue),
                    { labelType, labelTypeValue }
                );
            }
        }
    }

    return Array.from(collisions.values());
}

/**
 * Adds a label assignment to the output port behavior string, including the `excludes` relations.
 */
function addLabelAssignment(
    portBehavior: string[],
    toAdd: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
    labelTypeRegistry: LabelTypeRegistry
): string[] {
    const setAssignment = `set ${toAdd.labelType.name}.${toAdd.labelTypeValue.text}`
    const unsetAssignments: string[] = toAdd.labelTypeValue.excludes.map((exclude) => {
        const { labelType, labelTypeValue } = labelTypeRegistry.resolveLabelAssignment(exclude)
        if ( !labelType || !labelTypeValue ) return "";
        return `unset ${labelType.name}.${labelTypeValue.text}`
    })

    return [...portBehavior, setAssignment, ...unsetAssignments]
}

/**
 * Removes all assignments of a label from output port behavior string, including the `excludes` relations.
 */
function removeLabelAssignment(
    portBehavior: string[],
    toRemove: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
): string[] {
    let removing = false;

    return portBehavior.filter(line => {
        if (line === `set ${toRemove.labelType.name}.${toRemove.labelTypeValue.text}`) {
            removing = true;
            return false;
        }

        if (removing) {
            if (line.startsWith("unset ")) {
                return false;
            }

            if (line.startsWith("set ")) {
                removing = false;
                return true;
            }
        }

        return true;
    });
}