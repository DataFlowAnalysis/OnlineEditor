import { injectable } from "inversify";
import { Command, CommandExecutionContext, SModelRoot, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { constructorInject } from "../utils";

export interface LogHelloAction extends Action {
    kind: typeof LogHelloAction.KIND;
    message: string;
}
export namespace LogHelloAction {
    export const KIND = "log-hello";

    export function create(message: string): LogHelloAction {
        return {
            kind: KIND,
            message,
        };
    }
}

@injectable()
export class LogHelloCommand extends Command {
    static readonly KIND = LogHelloAction.KIND;

    constructor(@constructorInject(TYPES.Action) private action: LogHelloAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        console.log(`Hello world ${this.action.message}!`);
        return context.root;
    }

    undo(context: CommandExecutionContext): SModelRoot {
        console.log(`Hello world (undo) ${this.action.message}!`);
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        console.log(`Hello world (redo) ${this.action.message}!`);
        return context.root;
    }
}
