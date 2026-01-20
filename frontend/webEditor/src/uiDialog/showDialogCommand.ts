import { Action } from "sprotty-protocol";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    TYPES,
} from "sprotty";
import { AbstractDialog } from "./index.ts";
import { inject, injectable } from "inversify";

export interface ShowDialogAction<T extends AbstractDialog> extends Action {
    dialog: T
}

export namespace CreateShowDialogAction {
    export function create<T extends AbstractDialog>(dialog: T): ShowDialogAction<T> {
        return {
            kind: ShowDialogCommand.KIND,
            dialog
        }
    }
}

@injectable()
export class ShowDialogCommand<T extends AbstractDialog> implements Command {
    public static readonly KIND = "showDialog"

    constructor(
        @inject(TYPES.Action) private readonly action: ShowDialogAction<T>,
    ) {}

    execute(context: CommandExecutionContext): CommandReturn {
        this.action.dialog.show(context.root)
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        this.action.dialog.show(context.root)
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        this.action.dialog.hide();
        return context.root;
    }
}