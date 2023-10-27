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
        const root = this.findRoot(target);
        if (!this.element || !root) {
            return [];
        }

        if (this.element instanceof SEdgeImpl) {
            // TODO: implement
        } else {
            // Adjust the position of the node/port so that it is centered on the cursor.
            const { width, height } = this.element.bounds;
            const adjust = (offset: number, size: number) => {
                const mousePosition = offset / root.zoom;
                if (this.element instanceof SNodeImpl) {
                    // The element should be created to have its center at the mouse position.
                    // Because of this, we need to adjust the position by half the size of the element.
                    return mousePosition - size / 2;
                } else {
                    // For ports we can leave the position as is because the correction to center the element
                    //  around the mouse pointer is done by the PortAwareSnapper
                    return mousePosition;
                }
            };

            const previousPosition = this.element.position;
            const newPosition = {
                x: root.scroll.x + adjust(event.offsetX, width),
                y: root.scroll.y + adjust(event.offsetY, height),
            };

            if (this.element instanceof SPortImpl) {
                // Port positions must be relative to the target node.
                // So we need to convert the absolute graph position of the mouse
                // to a position relative to the target node.
                const parent = this.element.parent;
                if (parent instanceof SNodeImpl) {
                    newPosition.x -= parent.position.x;
                    newPosition.y -= parent.position.y;
                }
            }

            const newPositionSnapped = this.snapper.snap(newPosition, this.element);

            if (!Point.equals(previousPosition, newPositionSnapped)) {
                // Only update if the position after snapping has changed (aka the effective position).
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

    private findRoot(target: SModelElementImpl): SGraphImpl | undefined {
        if (target instanceof SGraphImpl) {
            return target;
        } else if (target instanceof SChildElementImpl) {
            return this.findRoot(target.parent);
        } else {
            return undefined;
        }
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
