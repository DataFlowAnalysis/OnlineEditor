import { Command, CommandExecutionContext, CommandReturn, SModelRootImpl, TYPES } from "sprotty";
import { TFGManager } from "./tfgManager";
import { ConstraintRegistry } from "./constraintRegistry";
import { Action, getBasicType } from "sprotty-protocol";
import { DfdNodeImpl } from "../diagram/nodes/common";
import { inject } from "inversify";

function selectConstraints(
    selectedConstraintNames: string[],
    root: SModelRootImpl,
    constraintRegistry: ConstraintRegistry,
    tfgManager: TFGManager,
) {
    tfgManager.clearTfgs();
    constraintRegistry.setSelectedConstraints(selectedConstraintNames);

    const nodes = root.children.filter((node) => getBasicType(node) === "node") as DfdNodeImpl[];
    if (selectedConstraintNames.length === 0) {
        nodes.forEach((node) => {
            node.setColor("var(--color-primary)");
        });
        return root;
    }

    nodes.forEach((node) => {
        const annotations = node.annotations!;
        let wasAdjusted = false;
        if (constraintRegistry.selectedContainsAllConstraints()) {
            annotations.forEach((annotation) => {
                if (annotation.message.startsWith("Constraint")) {
                    wasAdjusted = true;
                    node.setColor(annotation.color!);
                }
            });
        }
        selectedConstraintNames.forEach((name) => {
            annotations.forEach((annotation) => {
                if (annotation.message.startsWith("Constraint ") && annotation.message.split(" ")[1] === name) {
                    node.setColor(annotation.color!);
                    wasAdjusted = true;
                    tfgManager.addTfg(annotation.tfg!);
                }
            });
        });
        if (!wasAdjusted) node.setColor("var(--color-primary)");
    });

    nodes.forEach((node) => {
        const inTFG = node.annotations!.filter((annotation) => tfgManager.getSelectedTfgs().has(annotation.tfg!));
        if (inTFG.length > 0) node.setColor("var(--color-highlighted)", false);
    });

    return root;
}

interface SelectConstraintsAction extends Action {
    selectedConstraintNames: string[];
}

export namespace SelectConstraintsAction {
    export const KIND = "select-constraints";
    export function create(selectedConstraintNames: string[]): SelectConstraintsAction {
        return {
            kind: KIND,
            selectedConstraintNames,
        };
    }
}

export class SelectConstraintsCommand extends Command {
    static readonly KIND = SelectConstraintsAction.KIND;
    private oldConstraintSelection?: string[];

    constructor(
        @inject(TYPES.Action) private readonly action: SelectConstraintsAction,
        @inject(ConstraintRegistry) private readonly constraintRegistry: ConstraintRegistry,
        @inject(TFGManager) private readonly tfgManager: TFGManager,
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.oldConstraintSelection = this.constraintRegistry.getSelectedConstraints();
        return selectConstraints(
            this.action.selectedConstraintNames,
            context.root,
            this.constraintRegistry,
            this.tfgManager,
        );
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return selectConstraints(
            this.oldConstraintSelection ?? [],
            context.root,
            this.constraintRegistry,
            this.tfgManager,
        );
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return selectConstraints(
            this.action.selectedConstraintNames,
            context.root,
            this.constraintRegistry,
            this.tfgManager,
        );
    }
}
