import { inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    SChildElementImpl,
    SEdgeImpl,
    SModelElementImpl,
    SNodeImpl,
    TYPES,
    isSelectable,
} from "sprotty";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { generateRandomSprottyId } from "../../utils";
import { DfdNode, DfdNodeImpl } from "../dfdElements/nodes";
import { Action, SPort } from "sprotty-protocol";
import { ArrowEdge, ArrowEdgeImpl } from "../dfdElements/edges";

export interface PasteElementsAction extends Action {
    kind: typeof PasteElementsAction.KIND;
    copyElements: SModelElementImpl[];
}
export namespace PasteElementsAction {
    export const KIND = "paste-clipboard-elements";
    export function create(copyElements: SModelElementImpl[]): PasteElementsAction {
        return {
            kind: KIND,
            copyElements,
        };
    }
}

/**
 * This command is used to paste elements that were copied by the CopyPasteFeature.
 * It creates new elements and copies the properties of the copied elements.
 * This is done inside a command, so that it can be undone/redone.
 */
@injectable()
export class PasteElementsCommand extends Command {
    public static readonly KIND = PasteElementsAction.KIND;

    @inject(DynamicChildrenProcessor)
    private dynamicChildrenProcessor: DynamicChildrenProcessor = new DynamicChildrenProcessor();
    private newElements: SChildElementImpl[] = [];
    // This maps the element id of the copy source element to the
    // id that the newly created copy target element has.
    private copyElementIdMapping: Record<string, string> = {};

    constructor(@inject(TYPES.Action) private readonly action: PasteElementsAction) {
        super();
    }

    /**
     * Selectes the newly created copy and deselects the copy source.
     */
    private setSelection(context: CommandExecutionContext, selection: "old" | "new"): void {
        Object.entries(this.copyElementIdMapping).forEach(([oldId, newId]) => {
            const oldElement = context.root.index.getById(oldId);
            const newElement = context.root.index.getById(newId);

            if (oldElement && isSelectable(oldElement)) {
                oldElement.selected = selection === "old";
            }
            if (newElement && isSelectable(newElement)) {
                newElement.selected = selection === "new";
            }
        });
    }

    execute(context: CommandExecutionContext): CommandReturn {
        // Step 1: copy nodes and their ports
        this.action.copyElements.forEach((element) => {
            if (!(element instanceof SNodeImpl)) {
                return;
            }

            const schema = {
                id: generateRandomSprottyId(),
                type: element.type,
                position: { x: element.position.x + 30, y: element.position.y + 30 },
                size: { height: -1, width: -1 },
                text: "",
                labels: [],
                ports: [],
            } as DfdNode;

            this.copyElementIdMapping[element.id] = schema.id;

            if (element instanceof DfdNodeImpl) {
                schema.text = element.text;
                element.labels.forEach((label) => schema.labels.push(label));
                element.ports.forEach((port) => {
                    const portSchema = {
                        type: port.type,
                        id: generateRandomSprottyId(),
                    } as SPort;

                    this.copyElementIdMapping[port.id] = portSchema.id;

                    if ("position" in port && port.position) {
                        portSchema.position = { x: port.position.x, y: port.position.y };
                    }

                    schema.ports.push(portSchema);
                });
            }

            // Generate dynamic sub elements
            this.dynamicChildrenProcessor.processGraphChildren(schema, "set");

            const newElement = context.modelFactory.createElement(schema);
            this.newElements.push(newElement);
        });

        // Step 2: copy edges
        // If the source and target element of an edge are copied, the edge can be copied as well.
        // If only one of them is copied, the edge is not copied.
        this.action.copyElements.forEach((element) => {
            if (!(element instanceof SEdgeImpl)) {
                return;
            }

            const newSourceId = this.copyElementIdMapping[element.sourceId];
            const newTargetId = this.copyElementIdMapping[element.targetId];

            if (!newSourceId || !newTargetId) {
                // Not both source and target are copied, ignore this edge
                return;
            }

            const schema = {
                id: generateRandomSprottyId(),
                type: element.type,
                sourceId: newSourceId,
                targetId: newTargetId,
            } as ArrowEdge;
            this.copyElementIdMapping[element.id] = schema.id;

            if (element instanceof ArrowEdgeImpl) {
                schema.text = element.editableLabel?.text ?? "";
            }

            // Generate dynamic sub elements (the edge label)
            this.dynamicChildrenProcessor.processGraphChildren(schema, "set");

            const newElement = context.modelFactory.createElement(schema);
            this.newElements.push(newElement);
        });

        // Step 3: add new elements to the model and select them
        this.newElements.forEach((element) => {
            context.root.add(element);
        });
        this.setSelection(context, "new");

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // Remove elements from the model
        this.newElements.forEach((element) => {
            context.root.remove(element);
        });
        // Select the old elements
        this.setSelection(context, "old");

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        this.newElements.forEach((element) => {
            context.root.add(element);
        });
        this.setSelection(context, "new");

        return context.root;
    }
}
