import { inject, injectable, multiInject, optional } from "inversify";
import { MouseEventKind, MouseListener, MouseTool, SModelRootImpl, TYPES } from "sprotty";
import { SETTINGS } from "../settings/Settings";
import { EditorModeController } from "../settings/editorMode";

@injectable()
export class EditModeAwareMouseTool extends MouseTool {
    constructor(
        @inject(SETTINGS.Mode)
        private readonly editorModeController: EditorModeController,
        @multiInject(TYPES.MouseListener) @optional() mouseListeners: MouseListener[] = [],
    ) {
        super(mouseListeners);
    }

    protected handleEvent(methodName: MouseEventKind, model: SModelRootImpl, event: MouseEvent): void {
        if (this.editorModeController.get() === "embed") {
            const target = this.getTargetElement(model, event);
            let eventShouldBeExecuted = false;
            if (target?.id.startsWith("root")) eventShouldBeExecuted = true;
            if (target?.type.startsWith("port") && methodName === "doubleClick") eventShouldBeExecuted = true;
            if (!eventShouldBeExecuted) {
                event.preventDefault();
                return;
            }
        }
        super.handleEvent(methodName, model, event);
    }
}
