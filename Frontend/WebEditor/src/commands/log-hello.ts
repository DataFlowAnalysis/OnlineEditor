import { injectable } from "inversify";
import { Command, CommandExecutionContext, SModelRoot, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { constructorInject } from "../utils";

// This is a demonstration of a custom command/action implementation.

// The action interface declares what data can or must be passed to the command.
export interface LogHelloAction extends Action {
    kind: typeof LogHelloAction.KIND;
    message: string;
}
// This is just a utility function to construct the action using LogHelloAction.create("my message")
export namespace LogHelloAction {
    export const KIND = "log-hello";

    export function create(message: string): LogHelloAction {
        return {
            kind: KIND,
            message,
        };
    }
}

// The command class implements the actual logic that should be executed when calling an action.
// Matching of the command and action happen in sprotty internally using the kind value.
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

    // Allows undoing/redoing the custom command using special (optional) implementations.

    undo(context: CommandExecutionContext): SModelRoot {
        console.log(`Hello world (undo) ${this.action.message}!`);
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        console.log(`Hello world (redo) ${this.action.message}!`);
        return context.root;
    }
}
