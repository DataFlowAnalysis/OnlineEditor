import { injectable, inject } from "inversify";
import {
    KeyListener,
    SModelElementImpl,
    MousePositionTracker,
    SModelRootImpl,
    isSelected,
    CommitModelAction,
    CommandExecutionContext,
    Command,
    CommandReturn,
    SChildElementImpl,
    SEdgeImpl,
    SNodeImpl,
    TYPES,
} from "sprotty";
import { Action, Point, SEdge, SModelElement } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { DfdNodeImpl, DfdNode } from "../diagram/nodes/common";
import { EditorModeController } from "../settings/editorMode";
import { generateRandomSprottyId } from "../utils/idGenerator";
import { SETTINGS } from "../settings/Settings";
import { LoadJsonCommand } from "../serialize/loadJson";

/**
 * This class is responsible for listening to ctrl+c and ctrl+v events.
 * On copy the selected elements are copied into an internal array.
 * On paste the {@link PasteElementsAction} is executed to paste the elements.
 * This is done inside a command, so that it can be undone/redone.
 */
@injectable()
export class CopyPasteKeyListener implements KeyListener {
    private copyElements: SModelElementImpl[] = [];

    constructor(@inject(MousePositionTracker) private readonly mousePositionTracker: MousePositionTracker) {}

    keyUp(): Action[] {
        return [];
    }

    keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyC", "ctrl")) {
            return this.copy(element.root);
        } else if (matchesKeystroke(event, "KeyV", "ctrl")) {
            return this.paste();
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
     * This is done inside a command, so that it can be undone/redone.
     */
    private paste(): Action[] {
        const targetPosition = this.mousePositionTracker.lastPositionOnDiagram ?? { x: 0, y: 0 };
        return [PasteElementsAction.create(this.copyElements, targetPosition), CommitModelAction.create()];
    }
}

export interface PasteElementsAction extends Action {
    kind: typeof PasteElementsAction.KIND;
    copyElements: SModelElementImpl[];
    targetPosition: Point;
}
export namespace PasteElementsAction {
    export const KIND = "paste-clipboard-elements";
    export function create(copyElements: SModelElementImpl[], targetPosition: Point): PasteElementsAction {
        return {
            kind: KIND,
            copyElements,
            targetPosition,
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

    private newElements: SChildElementImpl[] = [];
    // This maps the element id of the copy source element to the
    // id that the newly created copy target element has.
    private copyElementIdMapping: Record<string, string> = {};

    constructor(
        @inject(TYPES.Action) private readonly action: PasteElementsAction,
        @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController,
    ) {
        super();
    }

    /**
     * Calculates the offset between the copy source elements and the set paste target position.
     * Does this by finding the top left position of the copy source elements and subtracting it from the target position.
     *
     * @returns The offset between the top left position of the copy source elements and the target position.
     */
    private computeElementOffset(): Point {
        const sourcePosition = { x: Infinity, y: Infinity };

        this.action.copyElements.forEach((element) => {
            if (!(element instanceof SNodeImpl)) {
                return;
            }

            if (element.position.x < sourcePosition.x) {
                sourcePosition.x = element.position.x;
            }
            if (element.position.y < sourcePosition.y) {
                sourcePosition.y = element.position.y;
            }
        });

        if (sourcePosition.x === Infinity || sourcePosition.y === Infinity) {
            return { x: 0, y: 0 };
        }

        // Compute delta between top left position of copy source elements and the target position
        return Point.subtract(this.action.targetPosition, sourcePosition);
    }

    execute(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController?.isReadOnly()) {
            return context.root;
        }

        // Step 1: copy nodes and their ports
        const positionOffset = this.computeElementOffset();
        this.action.copyElements.forEach((element) => {
            if (!(element instanceof SNodeImpl)) {
                return;
            }

            // createSchema only does a shallow copy, so we need to do an additional deep copy here because
            // we want to support copying elements with objects and arrays in them.
            const schema = JSON.parse(JSON.stringify(context.modelFactory.createSchema(element))) as SModelElement;
            if ("features" in schema) {
                schema.features = undefined;
            }

            schema.id = generateRandomSprottyId();
            this.copyElementIdMapping[element.id] = schema.id;
            if ("position" in schema) {
                schema.position = Point.add(element.position, positionOffset);
            }

            if (element instanceof DfdNodeImpl) {
                // Special case for DfdNodes: copy ports and give the nodes new ids.
                (schema as DfdNode).ports.forEach((port) => {
                    const oldPortId = port.id;
                    port.id = generateRandomSprottyId();
                    this.copyElementIdMapping[oldPortId] = port.id;
                });
            }

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

            const schema = JSON.parse(JSON.stringify(context.modelFactory.createSchema(element))) as SEdge;
            LoadJsonCommand.preprocessModelSchema(schema);

            schema.id = generateRandomSprottyId();
            this.copyElementIdMapping[element.id] = schema.id;

            schema.sourceId = newSourceId;
            schema.targetId = newTargetId;

            const newElement = context.modelFactory.createElement(schema);
            this.newElements.push(newElement);
        });

        // Step 3: add new elements to the model and select them
        this.newElements.forEach((element) => {
            context.root.add(element);
        });
        //this.setSelection(context, "new");

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController?.isReadOnly()) {
            return context.root;
        }

        // Remove elements from the model
        this.newElements.forEach((element) => {
            context.root.remove(element);
        });
        // Select the old elements
        //this.setSelection(context, "old");

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.editorModeController?.isReadOnly()) {
            return context.root;
        }

        this.newElements.forEach((element) => {
            context.root.add(element);
        });
        //this.setSelection(context, "new");

        return context.root;
    }
}
