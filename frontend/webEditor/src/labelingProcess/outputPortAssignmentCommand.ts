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
import { LabelType, LabelTypeValue } from "../labels/LabelType.ts";


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
            kind: OutputPortAssignmentCommand.KIND,
            element,
            collisionMode: collisionMode ?? 'askUser'
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
        @inject(LabelingProcessUi) private readonly labelingProcessUI: LabelingProcessUi,
        @inject(ExcludesDialog) private readonly excludesDialog: ExcludesDialog
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        const labelProcessState = this.labelingProcessUI.getState()
        if (labelProcessState.state !== "inProgress") return context.root;

        const { labelType, labelTypeValue } = this.labelTypeRegistry.resolveLabelAssignment(labelProcessState.activeLabel)
        if (!labelType || !labelTypeValue) return context.root;

        this.previousBehavior = this.action.element.getBehavior()
        if (!isThreatModelingLabelType(labelType) || !isThreatModelingLabelTypeValue(labelTypeValue)) {
            this.handleNonThreatModelingCase(labelType, labelTypeValue);
            return context.root;
        }

        let lines = this.previousBehavior
            .split("\n")
            .map(line => line.trim());
        const collisions = findAllCollisions(lines, { labelType, labelTypeValue }, this.labelTypeRegistry)

        console.error(this.previousBehavior)
        console.error(`${labelType.name}.${labelTypeValue.text}`)
        console.error(labelTypeValue.excludes)
        console.error(collisions)

        if (collisions.length == 0) {
            this.handleSimpleCase(lines, { labelType, labelTypeValue })
            return context.root;
        }

        if (this.action.collisionMode === "askUser") {
            this.handleAskUser({ labelType, labelTypeValue }, collisions, context)
            return context.root
        }

        this.handleOverwrite(lines, { labelType, labelTypeValue }, collisions)
        return context.root
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

    private handleNonThreatModelingCase(
        labelType: LabelType,
        labelTypeValue: LabelTypeValue,
    ) {
        this.newBehavior = `${this.previousBehavior}\nset ${labelType.name}.${labelTypeValue.text}`
        this.action.element.setBehavior(this.newBehavior);
        this.action.element.setColor(LabelingProcessUi.ALREADY_ASSIGNED_COLOR)
    }

    private handleSimpleCase(
        lines: string[],
        candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
    ) {
        lines = addLabelAssignment(lines, candidate, this.labelTypeRegistry)
        this.newBehavior = lines.join("\n")
        this.action.element.setBehavior(this.newBehavior);
        this.action.element.setColor(LabelingProcessUi.ALREADY_ASSIGNED_COLOR)
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
        this.newBehavior = lines.join("\n")
        this.action.element.setBehavior(this.newBehavior);
        this.action.element.setColor(LabelingProcessUi.ALREADY_ASSIGNED_COLOR)
    }
}

function findAllCollisions(
    portBehavior: string[],
    candidate: { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue },
    labelTypeRegistry: LabelTypeRegistry
): { labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }[] {
    const collisions: Set<{ labelType: ThreatModelingLabelType, labelTypeValue: ThreatModelingLabelTypeValue }> = new Set();

    for (let i = 0; i < portBehavior.length; i++) {
        const line = portBehavior[i]

        //Search for a previous assignment that excludes the new assignment
        if (line.match(`unset ${candidate.labelType.name}.${candidate.labelTypeValue.text}`)) {
            //Searches for the previous `set` assignment
            //Assumes that each `set` assignment is directly followed by their `unset` (`exclude`) assignments
            for (let j = i; j >= 0; j--) {
                if (portBehavior[j].match(`set`)) {
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

                    collisions.add({ labelType, labelTypeValue })
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

            if (line.match(`set ${labelType.name}.${labelTypeValue.text}`)) {
                collisions.add({ labelType, labelTypeValue });
            }
        }
    }

    collisions.delete(candidate)
    return Array.from(collisions);
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