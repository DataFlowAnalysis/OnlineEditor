import { inject, injectable } from "inversify";
import {
    CommandExecutionContext,
    CommandReturn,
    DeleteElementCommand,
    EditLabelMouseListener,
    SModelElementImpl,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { SETTINGS } from "../settings/Settings";
import { EditorModeController } from "../settings/editorMode";

@injectable()
export class EditorModeAwareEditLabelMouseListener extends EditLabelMouseListener {
    constructor(
        @inject(SETTINGS.Mode)
        private readonly editorModeController: EditorModeController,
    ) {
        super();
    }

    doubleClick(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        if (this.editorModeController.isReadOnly()) {
            return [];
        }

        return super.doubleClick(target, event);
    }
}

@injectable()
export class EditorModeAwareDeleteElementCommand extends DeleteElementCommand {
    @inject(SETTINGS.Mode)
    private readonly editorModeController?: EditorModeController;

    execute(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController?.isReadOnly()) {
            return context.root;
        }

        return super.execute(context);
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController?.isReadOnly()) {
            return context.root;
        }

        return super.undo(context);
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController?.isReadOnly()) {
            return context.root;
        }

        return super.redo(context);
    }
}
