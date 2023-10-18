import {
    CommitModelAction,
    IModelFactory,
    KeyListener,
    SChildElementImpl,
    SEdgeImpl,
    SModelElementImpl,
    SModelRootImpl,
    SNodeImpl,
    TYPES,
    isSelected,
} from "sprotty";
import { Action, SPort, SelectAction } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { generateRandomSprottyId } from "../utils";
import { DynamicChildrenProcessor } from "../features/dfdElements/dynamicChildren";
import { injectable, inject } from "inversify";
import { DfdNode, DfdNodeImpl } from "../features/dfdElements/nodes";
import { ArrowEdge, ArrowEdgeImpl } from "../features/dfdElements/edges";

/**
 * This feature allows the user to copy and paste elements.
 * When ctrl+c is pressed, all selected elements are copied into an internal array.
 * When ctrl+v is pressed, all elements in the internal array are pasted with an fixed offset.
 * Nodes are copied with their ports and edges are copied if source and target were copied as well.
 */
@injectable()
export class CopyPasteFeature implements KeyListener {
    private copyElements: SModelElementImpl[] = [];

    constructor(
        @inject(DynamicChildrenProcessor) private readonly dynamicChildrenProcessor: DynamicChildrenProcessor,
        @inject(TYPES.IModelFactory) private readonly modelFactory: IModelFactory,
    ) {}

    keyUp(_element: SModelElementImpl, _event: KeyboardEvent): Action[] {
        return [];
    }

    keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyC", "ctrl")) {
            return this.copy(element.root);
        } else if (matchesKeystroke(event, "KeyV", "ctrl")) {
            return this.paste(element.root);
        }

        return [];
    }

    /**
     * Copy all selected elements into the "clipboard" (the internal element array)
     */
    private copy(root: SModelRootImpl): Action[] {
        this.copyElements = []; // Clear the clipboard

        // Find selected elements
        root.index
            .all()
            .filter((element) => isSelected(element))
            .forEach((e) => this.copyElements.push(e));

        return [];
    }

    /**
     * Pastes elements by creating new elements and copying the properties of the copied elements.
     */
    private paste(root: SModelRootImpl): Action[] {
        // This maps the element id of the copy source element to the
        // id that the newly created copy target element has.
        const copyElementIdMapping: Record<string, string> = {};

        // Step 1: copy nodes and their ports
        this.copyElements.forEach((element) => {
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

            copyElementIdMapping[element.id] = schema.id;

            if (element instanceof DfdNodeImpl) {
                schema.text = element.text;
                element.labels.forEach((label) => schema.labels.push(label));
                element.ports.forEach((port) => {
                    const portSchema = {
                        type: port.type,
                        id: generateRandomSprottyId(),
                    } as SPort;

                    copyElementIdMapping[port.id] = portSchema.id;

                    if ("position" in port && port.position) {
                        portSchema.position = { x: port.position.x, y: port.position.y };
                    }

                    schema.ports.push(portSchema);
                });
            }

            // Generate dynamic sub elements
            this.dynamicChildrenProcessor.processGraphChildren(schema, "set");

            const newElement = this.modelFactory.createElement(schema);
            root.add(newElement as SChildElementImpl);
        });

        // Step 2: copy edges
        // If the source and target element of an edge are copied, the edge can be copied as well.
        // If only one of them is copied, the edge is not copied.
        this.copyElements.forEach((element) => {
            if (!(element instanceof SEdgeImpl)) {
                return;
            }

            const newSourceId = copyElementIdMapping[element.sourceId];
            const newTargetId = copyElementIdMapping[element.targetId];

            console.log("edge", newSourceId, newTargetId, element);

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
            copyElementIdMapping[element.id] = schema.id;

            if (element instanceof ArrowEdgeImpl) {
                schema.text = element.editableLabel?.text ?? "";
            }

            // Generate dynamic sub elements (the edge label)
            this.dynamicChildrenProcessor.processGraphChildren(schema, "set");

            const newElement = this.modelFactory.createElement(schema);
            root.add(newElement as SChildElementImpl);
        });

        return [
            CommitModelAction.create(),
            SelectAction.create({
                // Select newly created elements
                selectedElementsIDs: Object.values(copyElementIdMapping),
                // Deselect all old elements that were used as a source for the copy
                deselectedElementsIDs: Object.keys(copyElementIdMapping),
            }),
        ];
    }
}
