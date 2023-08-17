import { inject } from "inversify";
import { Command, CommandExecutionContext, LocalModelSource, SModelRoot, TYPES } from "sprotty";
import { Action, IModelLayoutEngine, SGraph } from "sprotty-protocol";

export interface LayoutModelAction extends Action {
    kind: typeof LayoutModelAction.KIND;
}
export namespace LayoutModelAction {
    export const KIND = "layoutModel";

    export function create(): LayoutModelAction {
        return {
            kind: KIND,
        };
    }
}

export class LayoutModelCommand extends Command {
    static readonly KIND = LayoutModelAction.KIND;

    @inject(TYPES.IModelLayoutEngine)
    protected readonly layoutEngine?: IModelLayoutEngine;

    @inject(TYPES.ModelSource)
    protected readonly modelSource?: LocalModelSource;

    async execute(context: CommandExecutionContext): Promise<SModelRoot> {
        if (!this.layoutEngine || !this.modelSource) throw new Error("Missing injects");

        // Layouting is normally done on the graph schema.
        // This is not viable for us because the dfd nodes have a dynamically computed size.
        // This is only available on loaded classes of the elements, not the json schema.
        // Thankfully the node implementation classes have all needed properties as well.
        // So we can just force cast the graph from the loaded version into the "json graph schema".
        // Using of the "bounds" property that the implementation classes have is done using DfdElkLayoutEngine.
        const newModel = await this.layoutEngine.layout(context.root as unknown as SGraph);
        // Here we need to cast back.
        return newModel as unknown as SModelRoot;
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    redo(context: CommandExecutionContext): Promise<SModelRoot> {
        return this.execute(context);
    }
}
