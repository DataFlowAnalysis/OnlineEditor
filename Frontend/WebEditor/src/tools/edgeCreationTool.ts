import { ContainerModule, injectable } from "inversify";
import {
    AnchorComputerRegistry,
    MouseListener,
    MouseTool,
    Tool,
    SModelElement,
    isConnectable,
    TYPES,
    LocalModelSource,
    SEdge,
    EnableDefaultToolsAction,
} from "sprotty";
import { Action, SEdge as SEdgeSchema } from "sprotty-protocol";
import { EDITOR_TYPES, constructorInject, generateRandomSprottyId } from "../utils";

export class EdgeCreationToolMouseListener extends MouseListener {
    private source?: SModelElement;
    private target?: SModelElement;

    constructor(protected modelSource: LocalModelSource, private edgeType: string = "edge:arrow") {
        super();
    }

    override mouseDown(target: SModelElement, _event: MouseEvent): Action[] {
        // First click selects the source (if valid source element)
        // Second click selects the target and creates the edge (if valid target element)
        if (this.source === undefined) {
            return this.sourceClick(target);
        } else {
            return this.targetClick(target);
        }
    }

    private sourceClick(element: SModelElement): Action[] {
        if (this.canConnect(element, "source")) {
            this.source = element;
        }
        return [];
    }

    private targetClick(element: SModelElement): Action[] {
        if (this.source && this.source.id !== element.id && this.canConnect(element, "target")) {
            // Add edge to diagram
            this.target = element;
            const edge = {
                type: this.edgeType,
                id: generateRandomSprottyId(),
                sourceId: this.source.id,
                targetId: this.target.id,
            } as SEdgeSchema;
            this.modelSource.addElements([edge]);

            // Disables the EdgeCreationTool and only enables the default tools
            return [EnableDefaultToolsAction.create()];
        }
        return [];
    }

    private canConnect(element: SModelElement, type: "source" | "target"): boolean {
        if (type === "target" && element.id === this.source?.id) {
            // Cannot connect to itself
            return false;
        }

        // Construct pseudo edge to check if it can be connected
        const edge = new SEdge();
        edge.type = "edge:arrow";
        if (this.source) edge.sourceId = this.source.id;
        if (this.target) edge.targetId = this.target.id;

        return isConnectable(element) && element.canConnect(edge, type);
    }
}

@injectable()
export class EdgeCreationTool implements Tool {
    static ID = "edge-creation-tool";

    protected edgeCreationToolMouseListener: EdgeCreationToolMouseListener;

    constructor(
        @constructorInject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry,
        @constructorInject(MouseTool) protected mouseTool: MouseTool,
        @constructorInject(TYPES.ModelSource) protected modelSource: LocalModelSource,
    ) {
        this.edgeCreationToolMouseListener = new EdgeCreationToolMouseListener(this.modelSource);
    }

    get id(): string {
        return EdgeCreationTool.ID;
    }

    enable(): void {
        this.edgeCreationToolMouseListener = new EdgeCreationToolMouseListener(this.modelSource);
        this.mouseTool.register(this.edgeCreationToolMouseListener);
        console.log("EdgeCreationTool.enable()");
    }

    disable(): void {
        this.mouseTool.deregister(this.edgeCreationToolMouseListener);
        console.log("EdgeCreationTool.disable()");
    }
}

export const edgeCreationTool = new ContainerModule((bind) => {
    bind(EdgeCreationToolMouseListener).toSelf().inSingletonScope();
    bind(EdgeCreationTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.ITool).toService(EdgeCreationTool);
});
