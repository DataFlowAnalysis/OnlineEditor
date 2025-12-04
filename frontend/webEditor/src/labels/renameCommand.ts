import { Command, CommandExecutionContext, CommandReturn, LocalModelSource, SParentElementImpl, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { inject } from "inversify";
import { replace, ReplacementData } from "../languages/replace";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort";
import { LabelTypeRegistry } from "./LabelTypeRegistry";
import { AssignmentLanguageTreeBuilder } from "../assignment/language";
import { ConstraintDslTreeBuilder } from "../constraint/language";

interface ReplaceAction extends Action {
    replacements: ReplacementData[];
}

export namespace ReplaceAction {
    export const KIND = "replace-action";
    export function create(replacements: ReplacementData[]) {
        return {
            kind: KIND,
            replacements,
        };
    }
}

export class ReplaceCommand extends Command {
    static readonly KIND = ReplaceAction.KIND;

    constructor(
        @inject(TYPES.Action) private readonly action: ReplaceAction,
        @inject(ConstraintRegistry) private readonly constraintRegistry: ConstraintRegistry,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(TYPES.ModelSource) private readonly localModelSource: LocalModelSource,
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.iterateForPorts(context.root);
        for (const replacement of this.action.replacements) {
            this.constraintRegistry.setConstraints(
                replace(
                    this.constraintRegistry.getConstraintsAsText().split("\n"),
                    ConstraintDslTreeBuilder.buildTree(this.localModelSource, this.labelTypeRegistry),
                    replacement,
                ),
            );
        }
        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    iterateForPorts(element: SParentElementImpl) {
        if (element instanceof DfdOutputPortImpl) {
            for (const replacement of this.action.replacements) {
                element.setBehavior(
                    replace(
                        element.getBehavior().split("\n"),
                        AssignmentLanguageTreeBuilder.buildTree(element, this.labelTypeRegistry),
                        replacement,
                    ).join("\n"),
                );
            }
        }

        for (const child of element.children) {
            this.iterateForPorts(child);
        }
    }
}
