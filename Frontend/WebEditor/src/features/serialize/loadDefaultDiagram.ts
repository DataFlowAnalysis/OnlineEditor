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
import { Action } from "sprotty-protocol";
import { LabelType, LabelTypeRegistry } from "../labels/labelTypeRegistry";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { LoadDiagramCommand, postLoadActions } from "./load";
import defaultDiagramData from "./defaultDiagram.json";

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
    readonly blockUntil = LoadDiagramCommand.loadBlockUntilFn;

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

        const graphCopy = JSON.parse(JSON.stringify(defaultDiagramData.model));
        this.dynamicChildrenProcessor.processGraphChildren(graphCopy, "set");
        this.newRoot = context.modelFactory.createRoot(graphCopy);

        this.logger.info(this, "Default Model loaded successfully");

        this.oldLabelTypes = this.labelTypeRegistry.getLabelTypes();
        this.labelTypeRegistry.clearLabelTypes();
        defaultDiagramData.labelTypes.forEach((labelType) => {
            this.labelTypeRegistry.registerLabelType(labelType);
        });
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
        defaultDiagramData.labelTypes.forEach((labelType) => {
            this.labelTypeRegistry.registerLabelType(labelType);
        });
        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}
