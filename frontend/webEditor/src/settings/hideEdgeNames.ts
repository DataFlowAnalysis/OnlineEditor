import { Command, CommandExecutionContext, CommandReturn } from "sprotty";
import { Action } from "sprotty-protocol";

export namespace HideEdgeNamesAction {
    export const KIND = "hide-edge-names";
    export function create(): Action {
        return {
            kind: KIND,
        };
    }
}

export class HideEdgeNamesCommand extends Command {
    static readonly KIND = HideEdgeNamesAction.KIND;

    execute(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}
