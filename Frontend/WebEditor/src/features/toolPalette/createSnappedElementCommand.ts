import { inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    ISnapper,
    SChildElementImpl,
    SParentElementImpl,
    SShapeElementImpl,
    TYPES,
} from "sprotty";
import { Action, SModelElement } from "sprotty-protocol";

/**
 * This command creates a new element and adds it to the model.
 * This works like the sprotty integrated CreateElementAction, but
 * additionally snaps the new element to the grid before adding it.
 * It does this by updating the position of the element schema after
 * converting it into a model implementation object that is added to the model.
 * Just like with the CreateElementAction, the new element is added as a child of
 * the container element with the given ID.
 */
export interface CreateSnappedElementAction extends Action {
    kind: typeof CreateSnappedElementAction.TYPE;
    elementSchema: SModelElement;
    containerId: string;
}
export namespace CreateSnappedElementAction {
    export const TYPE = "create-snapped-element";
    export function create(elementSchema: SModelElement, containerId: string): CreateSnappedElementAction {
        return {
            kind: TYPE,
            elementSchema,
            containerId,
        };
    }
}

@injectable()
export class CreateSnappedElementCommand extends Command {
    public static readonly KIND = CreateSnappedElementAction.TYPE;
    @inject(TYPES.ISnapper) protected snapper: ISnapper | undefined;

    private container: SParentElementImpl | undefined;
    private newElement: SChildElementImpl | undefined;

    constructor(@inject(TYPES.Action) private action: CreateSnappedElementAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const container = context.root.index.getById(this.action.containerId);
        // Check whether we can add the element to the container (requires being a parent)
        if (container instanceof SParentElementImpl) {
            this.container = container;
            this.newElement = context.modelFactory.createElement(this.action.elementSchema);

            // Snapping requires the implementation object to be an SShapeElementImpl
            if (this.snapper && this.newElement instanceof SShapeElementImpl) {
                this.newElement.position = this.snapper.snap(this.newElement.position, this.newElement);
            }

            this.container.add(this.newElement);
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.container && this.newElement) {
            this.container.remove(this.newElement);
        }

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.container && this.newElement) {
            this.container.add(this.newElement);
        }

        return context.root;
    }
}
