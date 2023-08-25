import { inject, injectable } from "inversify";
import {
    ActionDispatcher,
    Command,
    CommandExecutionContext,
    CommandReturn,
    EMPTY_ROOT,
    ILogger,
    NullLogger,
    SModelRootImpl,
    TYPES,
} from "sprotty";
import { Action, SGraph, SEdge } from "sprotty-protocol";
import { generateRandomSprottyId } from "../../utils";
import { DfdNode } from "../dfdElements/nodes";
import { LabelType, LabelTypeRegistry } from "../labels/labelTypeRegistry";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { postLoadActions } from "./load";

const storageId = generateRandomSprottyId();
const functionId = generateRandomSprottyId();
const outputId = generateRandomSprottyId();
const locationLabelTypeId = generateRandomSprottyId();
const locationOnPremId = generateRandomSprottyId();
const locationCloudId = generateRandomSprottyId();

const defaultDiagramSchema: SGraph = {
    type: "graph",
    id: "root",
    children: [
        {
            type: "node:storage",
            id: storageId,
            text: "Database",
            labels: [
                {
                    labelTypeId: locationLabelTypeId,
                    labelTypeValueId: locationOnPremId,
                },
            ],
            position: { x: 100, y: 100 },
        } as DfdNode,
        {
            type: "node:function",
            id: functionId,
            text: "System",
            labels: [
                {
                    labelTypeId: locationLabelTypeId,
                    labelTypeValueId: locationCloudId,
                },
            ],
            position: { x: 200, y: 200 },
        } as DfdNode,
        {
            type: "node:input-output",
            id: outputId,
            text: "Customer",
            position: { x: 325, y: 207 },
            labels: [],
        } as DfdNode,
        {
            type: "edge:arrow",
            id: generateRandomSprottyId(),
            sourceId: storageId,
            targetId: functionId,
            text: "Read",
        } as SEdge,
        {
            type: "edge:arrow",
            id: generateRandomSprottyId(),
            sourceId: functionId,
            targetId: outputId,
        } as SEdge,
    ],
};
const locationLabelType: LabelType = {
    id: locationLabelTypeId,
    name: "DC Location",
    values: [
        {
            id: locationOnPremId,
            text: "On-Premise",
        },
        {
            id: locationCloudId,
            text: "Cloud",
        },
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
    @inject(DynamicChildrenProcessor)
    private readonly dynamicChildrenProcessor: DynamicChildrenProcessor = new DynamicChildrenProcessor();
    @inject(TYPES.IActionDispatcher)
    private readonly actionDispatcher: ActionDispatcher = new ActionDispatcher();
    @inject(LabelTypeRegistry)
    private readonly labelTypeRegistry: LabelTypeRegistry = new LabelTypeRegistry();

    private oldRoot: SModelRootImpl | undefined;
    private newRoot: SModelRootImpl | undefined;

    execute(context: CommandExecutionContext): CommandReturn {
        this.oldRoot = context.root;

        const graphCopy = JSON.parse(JSON.stringify(defaultDiagramSchema));
        this.dynamicChildrenProcessor.processGraphChildren(graphCopy, "set");
        this.newRoot = context.modelFactory.createRoot(graphCopy);

        this.logger.info(this, "Default Model loaded successfully");

        this.labelTypeRegistry.clearLabelTypes();
        this.labelTypeRegistry.registerLabelType(locationLabelType);
        this.logger.info(this, "Default Label Types loaded successfully");

        postLoadActions(this.newRoot, this.actionDispatcher);
        return this.newRoot;
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}
