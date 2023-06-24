import { inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    EMPTY_ROOT,
    ILogger,
    NullLogger,
    SModelRoot,
    TYPES,
} from "sprotty";
import { Action, SGraph as SGraphSchema, SEdge as SEdgeSchema } from "sprotty-protocol";
import { ExpanderModelSource } from "../modelSource";
import { DFDNodeSchema } from "../views";

const defaultDiagramSchema: SGraphSchema = {
    type: "graph",
    id: "root",
    children: [
        {
            type: "node:storage",
            id: "storage01",
            text: "Database",
            position: { x: 100, y: 100 },
            size: { width: 60, height: 30 },
        } as DFDNodeSchema,
        {
            type: "node:function",
            id: "function01",
            text: "System",
            position: { x: 200, y: 200 },
            size: { width: 50, height: 50 },
        } as DFDNodeSchema,
        {
            type: "node:input-output",
            id: "input01",
            text: "Customer",
            position: { x: 325, y: 205 },
            size: { width: 70, height: 40 },
        } as DFDNodeSchema,
        {
            type: "edge:arrow",
            id: "edge01",
            sourceId: "storage01",
            targetId: "function01",
            text: "Read",
        } as SEdgeSchema,
        {
            type: "edge:arrow",
            id: "edge02",
            sourceId: "function01",
            targetId: "input01",
        } as SEdgeSchema,
    ],
};

export interface LoadDefaultDiagramAction extends Action {
    readonly kind: typeof LoadDefaultDiagramAction.KIND;
}
export namespace LoadDefaultDiagramAction {
    export const KIND = "loadDefaultDiagram";

    export function create(): LoadDefaultDiagramAction {
        return {
            kind: KIND,
        };
    }
}

@injectable()
export class LoadDefaultDiagramCommand extends Command {
    static readonly KIND = LoadDefaultDiagramAction.KIND;
    @inject(TYPES.ILogger)
    private readonly logger: ILogger = new NullLogger();
    @inject(TYPES.ModelSource)
    private readonly modelSource: ExpanderModelSource = new ExpanderModelSource();

    private oldRoot: SModelRoot | undefined;
    private newRoot: SModelRoot | undefined;

    execute(context: CommandExecutionContext): CommandReturn {
        this.oldRoot = context.root;

        const graphCopy = JSON.parse(JSON.stringify(defaultDiagramSchema));
        this.modelSource.processGraph(graphCopy, "expand");
        this.newRoot = context.modelFactory.createRoot(graphCopy);

        this.logger.info(this, "Default Model loaded successfully");
        return this.newRoot;
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}
