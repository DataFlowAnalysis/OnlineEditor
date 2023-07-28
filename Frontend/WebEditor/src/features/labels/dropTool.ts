import { injectable } from "inversify";
import { LabelAssignment } from "./labelTypeRegistry";
import { Action } from "sprotty-protocol";
import {
    SModelElement,
    SChildElement,
    MouseListener,
    CommitModelAction,
    ILogger,
    MouseTool,
    TYPES,
    Tool,
} from "sprotty";
import { AddLabelAssignmentAction } from "./commands";
import { constructorInject } from "../../utils";
import { getParentWithDfdLabels } from "./elementFeature";

export const LABEL_ASSIGNMENT_MIME_TYPE = "application/x-label-assignment";

@injectable()
export class DfdLabelMouseDropListener extends MouseListener {
    constructor(@constructorInject(TYPES.ILogger) private logger: ILogger) {
        super();
    }

    override dragOver(_target: SModelElement, event: MouseEvent): Action[] {
        // Prevent the dragover prevent to indicated that the drop is possible
        // Check https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event for more details
        event.preventDefault();
        return [];
    }

    override drop(target: SChildElement, event: DragEvent): Action[] {
        const labelAssignmentJson = event.dataTransfer?.getData(LABEL_ASSIGNMENT_MIME_TYPE);
        if (!labelAssignmentJson) {
            return [];
        }

        const dfdLabelElement = getParentWithDfdLabels(target);
        if (!dfdLabelElement) {
            this.logger.info(
                this,
                "Aborted drop of label assignment because the target element nor the parent elements have the dfd label feature",
            );
            return [];
        }

        const labelAssignment = JSON.parse(labelAssignmentJson) as LabelAssignment;
        this.logger.info(this, "Adding label assignment to element", dfdLabelElement, labelAssignment);
        return [AddLabelAssignmentAction.create(dfdLabelElement, labelAssignment), CommitModelAction.create()];
    }
}

@injectable()
export class DfdLabelDropTool implements Tool {
    static ID = "dfd-label-drop-tool";

    constructor(
        @constructorInject(MouseTool) private mouseTool: MouseTool,
        @constructorInject(DfdLabelMouseDropListener) private mouseListener: DfdLabelMouseDropListener,
    ) {}

    get id(): string {
        return DfdLabelDropTool.ID;
    }

    enable(): void {
        this.mouseTool.register(this.mouseListener);
    }

    disable(): void {
        this.mouseTool.deregister(this.mouseListener);
    }
}
