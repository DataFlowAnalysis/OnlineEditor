import { inject } from "inversify";
import { Command, CommandExecutionContext, SModelRootImpl, TYPES } from "sprotty";
import { Action, IModelLayoutEngine, SGraph } from "sprotty-protocol";
import { DfdLayoutConfigurator } from "./layouter";
import { LayoutMethod } from "./layoutMethod";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";

export interface LayoutModelAction extends Action {
    kind: typeof LayoutModelAction.KIND;
    layoutMethod: LayoutMethod;
}
export namespace LayoutModelAction {
    export const KIND = "layoutModel";

    export function create(method: LayoutMethod): LayoutModelAction {
        return {
            kind: KIND,
            layoutMethod: method,
        };
    }
}

export class LayoutModelCommand extends Command {
    static readonly KIND = LayoutModelAction.KIND;

    private oldRoot?: SModelRootImpl;
    private newModel?: SModelRootImpl;

    constructor(
        @inject(TYPES.Action) private readonly action: LayoutModelAction,
        @inject(TYPES.IModelLayoutEngine) private readonly layoutEngine: IModelLayoutEngine,
        @inject(DfdLayoutConfigurator) private readonly configurator: DfdLayoutConfigurator ,
        @inject(LoadingIndicator) private readonly loadingIndicator: LoadingIndicator
    ) {
        super();
    }

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        this.loadingIndicator.showIndicator("Layouting...");
        this.oldRoot = context.root

        this.configurator.method = this.action.layoutMethod
        // Layouting is normally done on the graph schema.
        // This is not viable for us because the dfd nodes have a dynamically computed size.
        // This is only available on loaded classes of the elements, not the json schema.
        // Thankfully the node implementation classes have all needed properties as well.
        // So we can just force cast the graph from the loaded version into the "json graph schema".
        // Using of the "bounds" property that the implementation classes have is done using DfdElkLayoutEngine.
        const newModel = await this.layoutEngine.layout(context.root as unknown as SGraph);

        // Here we need to cast back.
        this.newModel = newModel as unknown as SModelRootImpl;
        this.loadingIndicator.hideIndicator();
        return this.newModel;
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        return this.oldRoot ?? context.root
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        return this.newModel ?? context.root
    }
}
