import { inject, injectable, multiInject, optional } from "inversify";
import { KeyListener, KeyTool, SModelRootImpl, TYPES } from "sprotty";
import { SETTINGS } from "../settings/Settings";
import { EditorModeController } from "../settings/editorMode";

@injectable()
export class EditModeAwareKeyTool extends KeyTool {
    constructor(
        @inject(SETTINGS.Mode)
        private readonly editorModeController: EditorModeController,
        @multiInject(TYPES.KeyListener) @optional() keyListeners: KeyListener[] = [],
    ) {
        super(keyListeners);
    }

    protected handleEvent<K extends keyof KeyListener>(
        methodName: K,
        model: SModelRootImpl,
        event: KeyboardEvent,
    ): void {
        if (this.editorModeController.get() === "embed") {
            event.preventDefault();
            return;
        }
        super.handleEvent(methodName, model, event);
    }
}
