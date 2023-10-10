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
import { DfdOutputPort } from "../dfdElements/ports";

const storageId = generateRandomSprottyId();
const storagePortId = generateRandomSprottyId();

const functionId = generateRandomSprottyId();
const functionPort1Id = generateRandomSprottyId();
const functionPort2Id = generateRandomSprottyId();

const outputId = generateRandomSprottyId();
const outputPortId = generateRandomSprottyId();

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
            position: { x: 100, y: 100 },
            text: "Database",
            labels: [
                {
                    labelTypeId: locationLabelTypeId,
                    labelTypeValueId: locationOnPremId,
                },
            ],
            ports: [
                {
                    type: "port:dfd-output",
                    id: storagePortId,
                    position: { x: 52, y: 38.5 },
                    behavior: "set t1.z1 = TRUE",
                } as DfdOutputPort,
            ],
        } as DfdNode,
        {
            type: "node:function",
            id: functionId,
            position: { x: 200, y: 200 },
            text: "System",
            labels: [
                {
                    labelTypeId: locationLabelTypeId,
                    labelTypeValueId: locationCloudId,
                },
            ],
            ports: [
                {
                    type: "port:dfd-input",
                    id: functionPort1Id,
                    position: { x: 10, y: -3.5 },
                },
                {
                    type: "port:dfd-output",
                    id: functionPort2Id,
                    position: { x: 74.5, y: 20 },
                    behavior: "forward Read\nset t1.z2 = Read.t1.x1",
                } as DfdOutputPort,
            ],
        } as DfdNode,
        {
            type: "node:input-output",
            id: outputId,
            position: { x: 325, y: 207 },
            text: "Customer",
            labels: [],
            ports: [
                {
                    type: "port:dfd-input",
                    id: outputPortId,
                    position: { x: -3.5, y: 13 },
                },
            ],
        } as DfdNode,
        {
            type: "edge:arrow",
            id: generateRandomSprottyId(),
            sourceId: storagePortId,
            targetId: functionPort1Id,
            text: "Read",
        } as SEdge,
        {
            type: "edge:arrow",
            id: generateRandomSprottyId(),
            sourceId: functionPort2Id,
            targetId: outputPortId,
            text: "",
        } as SEdge,
    ],
};
const locationLabelType: LabelType = {
    id: locationLabelTypeId,
    name: "DC_Location",
    values: [
        {
            id: locationOnPremId,
            text: "On_Premise",
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
    private oldLabelTypes: LabelType[] | undefined;

    execute(context: CommandExecutionContext): CommandReturn {
        this.oldRoot = context.root;

        const graphCopy = JSON.parse(JSON.stringify(defaultDiagramSchema));
        this.dynamicChildrenProcessor.processGraphChildren(graphCopy, "set");
        this.newRoot = context.modelFactory.createRoot(graphCopy);

        this.logger.info(this, "Default Model loaded successfully");

        this.oldLabelTypes = this.labelTypeRegistry.getLabelTypes();
        this.labelTypeRegistry.clearLabelTypes();
        this.labelTypeRegistry.registerLabelType(locationLabelType);
        this.logger.info(this, "Default Label Types loaded successfully");

        postLoadActions(this.newRoot, this.actionDispatcher);
        return this.newRoot;
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        this.labelTypeRegistry.clearLabelTypes();
        this.oldLabelTypes?.forEach((labelType) => this.labelTypeRegistry.registerLabelType(labelType));
        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        this.labelTypeRegistry.clearLabelTypes();
        this.labelTypeRegistry.registerLabelType(locationLabelType);
        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}
