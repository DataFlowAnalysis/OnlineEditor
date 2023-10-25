import { injectable, inject } from "inversify";
import { generateRandomSprottyId } from "../../utils";
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
    SGraphImpl,
    SModelElementImpl,
    SNodeImpl,
    TYPES,
} from "sprotty";
import { Action, Point } from "sprotty-protocol";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { DfdTool } from "./tool";

/**
 * Creates a node when the user clicks somewhere on the root graph.
 * The type and size of the node can be configured via the NodeMetadata.
 * Automatically disables itself after creating a node.
 */
@injectable()
export class NodeCreationTool extends MouseListener implements DfdTool {
    private node?: SNodeImpl;

    constructor(
        @inject(MouseTool) private mouseTool: MouseTool,
        @inject(DynamicChildrenProcessor) private dynamicChildrenProcessor: DynamicChildrenProcessor,
        @inject(TYPES.IModelFactory) private modelFactory: IModelFactory,
        @inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher,
        @inject(TYPES.ICommandStack) private commandStack: CommandStack,
        @inject(TYPES.ISnapper) private snapper: ISnapper,
        private nodeType = "node:storage",
    ) {
        super();
    }

    /**
     * Method to enable the tool and optionally select the type of node to be created.
     * If no type is given the default type/previous set type is used.
     */
    enable(nodeType?: string) {
        if (nodeType) {
            this.nodeType = nodeType;
        }
        this.node = this.createNode();

        this.mouseTool.register(this);
    }

    disable(): void {
        this.mouseTool.deregister(this);

        if (this.node) {
            // Node is not placed yet but we're disabling the tool.
            // This means the creation was cancelled and the node should be deleted.
            // We revert the last action to do this, which added the node to the graph.
            this.commandStack.undo();
            this.node = undefined;
        }
    }

    private createNode(): SNodeImpl {
        const defaultText = this.nodeType.replace("node:", "");
        // Capitalize first letter
        const defaultTextCapitalized = defaultText.charAt(0).toUpperCase() + defaultText.slice(1);

        const nodeSchema = {
            type: this.nodeType,
            id: generateRandomSprottyId(),
            text: defaultTextCapitalized,
            opacity: 0.5,
            position: {
                x: -Infinity,
                y: -Infinity,
            },
        };

        // Add any dynamically declared children to the node schema.
        this.dynamicChildrenProcessor.processGraphChildren(nodeSchema, "set");

        const node = this.modelFactory.createElement(nodeSchema);
        if (node instanceof SNodeImpl) {
            this.actionDispatcher.dispatch(AddElementToGraphAction.create(node));
            return node;
        } else {
            throw new Error("Created Node is not an instance of SNodeImpl");
        }
    }

    mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        const root = this.findRoot(target);
        if (!this.node || !root) {
            return [];
        }

        // Adjust the position of the node so that it is centered on the cursor.
        const { width, height } = this.node.bounds;
        const adjust = (offset: number, size: number) => {
            return offset / root.zoom - size / 2;
        };

        const previousPosition = this.node.position;
        const newPosition = this.snapper.snap(
            {
                x: root.scroll.x + adjust(event.offsetX, width),
                y: root.scroll.y + adjust(event.offsetY, height),
            },
            this.node,
        );

        if (!Point.equals(previousPosition, newPosition)) {
            // Only update if the position after snapping has changed (aka the effective position).
            this.node.position = newPosition;
            // Trigger re-rendering of the node
            this.commandStack.update(this.node.root);
        }

        return [];
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

    override mouseDown(_target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        event.preventDefault(); // prevents additional click onto the newly created element

        if (this.node) {
            // Make node fully visible
            this.node.opacity = 1;
            this.node = undefined; // Unset to prevent further actions
        }

        // This tool is done and can be disabled. No other nodes should be created unless re-enabled.
        this.disable();

        return [
            CommitModelAction.create(), // Save to ModelSource
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
        context.root.remove(this.action.element);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
