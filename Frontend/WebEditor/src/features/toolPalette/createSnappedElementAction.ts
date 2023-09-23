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
        if (container instanceof SParentElementImpl) {
            this.container = container;
            this.newElement = context.modelFactory.createElement(this.action.elementSchema);
            this.container.add(this.newElement);

            if (this.snapper && this.newElement instanceof SShapeElementImpl) {
                this.newElement.position = this.snapper.snap(this.newElement.position, this.newElement);
            }
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
