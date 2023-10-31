import {
    ActionDispatcher,
    CommandExecutionContext,
    CommandReturn,
    CommandStack,
    CommitModelAction,
    ICommand,
    IModelFactory,
    ISnapper,
    MouseListener,
    MouseTool,
    SChildElementImpl,
    SEdgeImpl,
    SGraphImpl,
    SModelElementImpl,
    SNodeImpl,
    SPortImpl,
    TYPES,
} from "sprotty";
import { DfdTool } from "./tool";
import { inject, injectable } from "inversify";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { Action, Point, SEdge, SNode, SPort, getBasicType } from "sprotty-protocol";

type Positionable = { position?: Point };
type Schema = (SNode | SEdge | SPort) & Positionable;
type Impl = SNodeImpl | SEdgeImpl | SPortImpl;

@injectable()
export abstract class CreationTool<S extends Schema, I extends Impl> extends MouseListener implements DfdTool {
    protected element?: I;
    protected readonly previewOpacity = 0.5;

    constructor(
        @inject(MouseTool) protected mouseTool: MouseTool,
        @inject(DynamicChildrenProcessor) protected dynamicChildrenProcessor: DynamicChildrenProcessor,
        @inject(TYPES.IModelFactory) protected modelFactory: IModelFactory,
        @inject(TYPES.IActionDispatcher) protected actionDispatcher: ActionDispatcher,
        @inject(TYPES.ICommandStack) protected commandStack: CommandStack,
        @inject(TYPES.ISnapper) protected snapper: ISnapper,
    ) {
        super();
    }

    abstract createElementSchema(): S;

    protected createElement(): I {
        const schema = this.createElementSchema();
        if (getBasicType(schema) === "node" || getBasicType(schema) === "port") {
            // Move node/port to the top left corner of the graph.
            // Otherwise it may be visible at the model origin till the first mouse move over the diagram.
            // Only for nodes and ports. Edges don't have a given position
            schema.position = {
                x: -Infinity,
                y: -Infinity,
            };
        }

        // Create the element with the preview opacity to indicated it is not placed yet
        schema.opacity = this.previewOpacity;

        // Add any dynamically declared children to the node schema.
        this.dynamicChildrenProcessor.processGraphChildren(schema, "set");

        const element = this.modelFactory.createElement(schema) as I;
        this.actionDispatcher.dispatch(AddElementToGraphAction.create(element));
        return element;
    }

    enable(): void {
        this.mouseTool.register(this);
        this.element = this.createElement();
    }

    disable(): void {
        this.mouseTool.deregister(this);

        if (this.element) {
            // Element is not placed yet but we're disabling the tool.
            // This means the creation was cancelled and the element should be deleted.
            // We revert the last action to do this, which added the element to the graph.
            this.commandStack.undo();
            this.element = undefined;
        }
    }

    protected finishPlacingElement(): void {
        if (this.element) {
            // Make node fully visible
            this.element.opacity = 1;
            this.element = undefined; // Unset to prevent further actions
        }
        this.disable();
    }

    mouseMove(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        const root = target.root as SGraphImpl;
        if (!this.element || !root) {
            return [];
        }

        // Calculate the position of the mouse in the graph

        const calculateMousePosition = (axis: "x" | "y") => {
            // Position of the top left viewport corner in the whole graph
            const rootPosition = root.scroll[axis];
            // Offset of the mouse position from the top left viewport corner in screen pixels
            const screenOffset = axis === "x" ? event.offsetX : event.offsetY;
            // Offset of the mouse position from the top left viewport corner in graph coordinates
            const screenOffsetNormalized = screenOffset / root.zoom;

            // Add position
            return rootPosition + screenOffsetNormalized;
        };
        const newPosition = {
            x: calculateMousePosition("x"),
            y: calculateMousePosition("y"),
        };

        if (this.element instanceof SEdgeImpl) {
            // Snap the edge target to the mouse position, if there is a target element.
            if (this.element.target) {
                if (!Point.equals(this.element.target.position, newPosition)) {
                    this.element.target.position = newPosition;
                    // Trigger re-rendering of the edge
                    this.commandStack.update(this.element.root);
                }
            }
        } else {
            const previousPosition = this.element.position;

            // Adapt the mouse position depending on element type
            if (this.element instanceof SNodeImpl) {
                // The node should be created to have its center at the mouse position.
                // Because of this, we need to adjust the position by half the size of the element.
                const { width, height } = this.element.bounds;
                newPosition.x -= width / 2;
                newPosition.y -= height / 2;
            } else if (this.element instanceof SPortImpl) {
                // Port positions must be relative to the target node.
                // So we need to convert the absolute graph position of the mouse
                // to a position relative to the target node.
                const parent = this.element.parent;
                if (parent instanceof SNodeImpl) {
                    newPosition.x -= parent.position.x;
                    newPosition.y -= parent.position.y;
                }
            }

            // Snap the element to the corresponding grid
            const newPositionSnapped = this.snapper.snap(newPosition, this.element);

            // Only update if the position after snapping has changed (aka the effective position).
            if (!Point.equals(previousPosition, newPositionSnapped)) {
                this.element.position = newPositionSnapped;
                // Trigger re-rendering of the node/port
                this.commandStack.update(this.element.root);
            }
        }

        return [];
    }

    mouseDown(_target: SModelElementImpl, event: MouseEvent): Action[] {
        event.preventDefault(); // prevents additional click onto the newly created element

        this.finishPlacingElement();

        return [
            CommitModelAction.create(), // Save to element ModelSource
        ];
    }
}

/**
 * Adds the given element to the graph at the root level.
 */
export interface AddElementToGraphAction extends Action {
    kind: typeof AddElementToGraphAction.TYPE;
    element: SChildElementImpl;
}
export namespace AddElementToGraphAction {
    export const TYPE = "addElementToGraph";
    export function create(element: SChildElementImpl): AddElementToGraphAction {
        return {
            kind: TYPE,
            element,
        };
    }
}

@injectable()
export class AddElementToGraphCommand implements ICommand {
    public static readonly KIND = AddElementToGraphAction.TYPE;

    constructor(@inject(TYPES.Action) private action: AddElementToGraphAction) {}

    execute(context: CommandExecutionContext): CommandReturn {
        context.root.add(this.action.element);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        this.action.element.parent.remove(this.action.element);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
