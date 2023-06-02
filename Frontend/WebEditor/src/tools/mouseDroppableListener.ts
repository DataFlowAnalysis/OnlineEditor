import { ContainerModule, injectable } from "inversify";
import { MouseListener, TYPES, LocalModelSource, Tool, MouseTool } from "sprotty";
import { SNode as SNodeSchema } from "sprotty-protocol";
import { SModelElement, Action } from "sprotty-protocol";
import { EDITOR_TYPES, constructorInject, generateRandomSprottyId } from "../utils";

/**
 * When dragging a node from the new element row from the top of the page to
 * the sprotty container it will land here.
 * The node schema of the node that should be created is read from the dataTransfer object.
 * The node schema is then used to create a the node which is moved to the point where the cursor has stopped dragging.
 */
@injectable()
class MouseDroppableListener extends MouseListener {
    constructor(@constructorInject(TYPES.ModelSource) protected modelSource: LocalModelSource) {
        super();
    }

    override dragOver(_target: SModelElement, event: DragEvent): (Action | Promise<Action>)[] {
        // TODO: I don't really know why we need to prevent the default event from happening here yet.
        // Without it the drop function does not get called correctly.
        // Maybe this could be used to preview elements before they are dropped?
        event.preventDefault();
        return [];
    }

    override drop(_target: SModelElement, event: DragEvent): (Action | Promise<Action>)[] {
        // Read node schema and parse it
        const nodeDataString = event.dataTransfer?.getData("application/json");
        const nodeData: SNodeSchema = nodeDataString ? JSON.parse(nodeDataString) : undefined;
        if (!nodeData) {
            return [];
        }

        this.modelSource.getViewport().then((viewport) => {
            nodeData.id = generateRandomSprottyId();
            if (!nodeData.size) {
                // Default sizes for nodes that don't have a size set.
                nodeData.size = {
                    width: 10,
                    height: 10,
                };
            }

            // Adjust the position of the node so that it is centered on the cursor.
            const adjust = (offset: number, size: number) => {
                return offset / viewport.zoom - size / 2;
            };
            nodeData.position = {
                x: viewport.scroll.x + adjust(event.offsetX, nodeData.size.width),
                y: viewport.scroll.y + adjust(event.offsetY, nodeData.size.height),
            };

            // Add the node to the diagram.
            this.modelSource.addElements([nodeData]);
        });

        return [];
    }
}

/**
 * A custom sprotty tool that registers a MouseDroppableListener by default (see below).
 */
@injectable()
export class MouseDroppableTool implements Tool {
    static ID = "droppable-mouse-listener";

    constructor(
        @constructorInject(MouseDroppableListener) protected mouseDroppableListener: MouseDroppableListener,
        @constructorInject(MouseTool) protected mouseTool: MouseTool,
    ) {}

    get id(): string {
        return MouseDroppableTool.ID;
    }

    enable(): void {
        this.mouseTool.register(this.mouseDroppableListener);
    }

    disable(): void {
        this.mouseTool.deregister(this.mouseDroppableListener);
    }
}

export const mouseDroppableTool = new ContainerModule((bind) => {
    bind(MouseDroppableListener).toSelf().inSingletonScope();
    bind(MouseDroppableTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.IDefaultTool).toService(MouseDroppableTool);
});
