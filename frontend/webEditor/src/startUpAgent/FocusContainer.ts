// The focus is run though an action and not directly in the start up agent, as sprotty is not initialized when the later is called, but when the action dispatcher can handle the action, it is
import { inject } from "inversify";
import { TYPES, ActionDispatcher, Command, CommandExecutionContext, CommandReturn } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";

export class FocusContainerStartUpAgent implements IStartUpAgent {
    constructor(@inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher) {}

    run(): void {
        this.actionDispatcher.dispatch({ kind: FocusContainerCommand.KIND });
    }
}

export class FocusContainerCommand extends Command {
    public static readonly KIND = "focus-container";

    execute(context: CommandExecutionContext): CommandReturn {
        document.getElementById("sprotty_root")?.focus();

        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}
