import { ContainerModule, inject, injectable } from "inversify";
import {
    MouseListener,
    MouseTool,
    Tool,
    SModelElement,
    CommitModelAction,
    SModelExtension,
    SParentElement,
    SChildElement,
    TYPES,
    ILogger,
    NullLogger,
} from "sprotty";
import { EDITOR_TYPES, constructorInject } from "./utils";
import { Action } from "sprotty-protocol";
import { AddLabelAssignmentAction } from "./commands/labelTypes";

export interface LabelType {
    id: string;
    name: string;
    values: LabelTypeValue[];
}

export interface LabelTypeValue {
    id: string;
    text: string;
}

export interface LabelAssignment {
    labelTypeId: string;
    labelTypeValueId: string;
}

export const LABEL_ASSIGNMENT_MIME_TYPE = "application/x-label-assignment";
export const containsDfdLabelFeature = Symbol("dfd-label-feature");

export interface ContainsDfdLabels extends SModelExtension {
    labels: LabelAssignment[];
}

export function containsDfdLabels<T extends SModelElement>(element: T): element is T & ContainsDfdLabels {
    return element.features?.has(containsDfdLabelFeature) ?? false;
}

// Traverses the graph upwards to find any element having the dfd label feature.
// This is needed because you may select/drop onto a child element of the node implementing and displaying dfd labels.
// If the element itself and no parent has the feature undefined is returned.
export function getParentWithDfdLabels(element: SChildElement | SParentElement): ContainsDfdLabels | undefined {
    if (containsDfdLabels(element)) {
        return element;
    }

    if ("parent" in element) {
        return getParentWithDfdLabels(element.parent);
    }

    return undefined;
}

@injectable()
export class LabelTypeRegistry {
    private labelTypes: LabelType[] = [];
    private updateCallbacks: (() => void)[] = [];

    public registerLabelType(labelType: LabelType): void {
        this.labelTypes.push(labelType);
        this.updateCallbacks.forEach((cb) => cb());
    }

    public unregisterLabelType(labelType: LabelType): void {
        this.labelTypes = this.labelTypes.filter((type) => type.id !== labelType.id);
        this.updateCallbacks.forEach((cb) => cb());
    }

    public clearLabelTypes(): void {
        this.labelTypes = [];
        this.updateCallbacks.forEach((cb) => cb());
    }

    public labelTypeChanged(): void {
        this.updateCallbacks.forEach((cb) => cb());
    }

    public onUpdate(callback: () => void): void {
        this.updateCallbacks.push(callback);
    }

    public getLabelTypes(): LabelType[] {
        return this.labelTypes;
    }

    public getLabelType(id: string): LabelType | undefined {
        return this.labelTypes.find((type) => type.id === id);
    }
}

@injectable()
export class LabelTypeMouseDropListener extends MouseListener {
    @inject(TYPES.ILogger)
    private logger: ILogger = new NullLogger();

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
export class LabelTypeTool implements Tool {
    static ID = "label-type-tool";

    constructor(
        @constructorInject(MouseTool) private mouseTool: MouseTool,
        @constructorInject(LabelTypeMouseDropListener) private mouseListener: LabelTypeMouseDropListener,
    ) {}

    get id(): string {
        return LabelTypeTool.ID;
    }

    enable(): void {
        this.mouseTool.register(this.mouseListener);
    }

    disable(): void {
        this.mouseTool.deregister(this.mouseListener);
    }
}

export const labelTypeModule = new ContainerModule((bind) => {
    bind(LabelTypeRegistry).toSelf().inSingletonScope();
    bind(LabelTypeMouseDropListener).toSelf().inSingletonScope();
    bind(LabelTypeTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.IDefaultTool).to(LabelTypeTool);
});
