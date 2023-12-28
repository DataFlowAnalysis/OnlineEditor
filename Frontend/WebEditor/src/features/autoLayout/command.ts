import { inject } from "inversify";
import { Command, CommandExecutionContext, LocalModelSource, SModelRootImpl, TYPES } from "sprotty";
import { Action, IModelLayoutEngine, SGraph, SModelRoot } from "sprotty-protocol";
import { LoadDiagramCommand } from "../serialize/load";

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
    private readonly layoutEngine?: IModelLayoutEngine;

    @inject(TYPES.ModelSource)
    private readonly modelSource?: LocalModelSource;

    private oldModelSchema?: SModelRoot;
    private newModel?: SModelRootImpl;

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        this.oldModelSchema = context.modelFactory.createSchema(context.root);

        if (!this.layoutEngine || !this.modelSource) throw new Error("Missing injects");

        // Layouting is normally done on the graph schema.
        // This is not viable for us because the dfd nodes have a dynamically computed size.
        // This is only available on loaded classes of the elements, not the json schema.
        // Thankfully the node implementation classes have all needed properties as well.
        // So we can just force cast the graph from the loaded version into the "json graph schema".
        // Using of the "bounds" property that the implementation classes have is done using DfdElkLayoutEngine.
        const newModel = await this.layoutEngine.layout(context.root as unknown as SGraph);
        // Here we need to cast back.
        this.newModel = newModel as unknown as SModelRootImpl;
        return this.newModel;
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        if (!this.oldModelSchema) {
            // This should never happen because execute() is called before undo() is called.
            throw new Error("No old model to restore");
        }

        LoadDiagramCommand.preprocessModelSchema(this.oldModelSchema);
        return context.modelFactory.createRoot(this.oldModelSchema);
    }

    redo(_context: CommandExecutionContext): SModelRootImpl {
        if (!this.newModel) {
            // This should never happen because execute() is called before redo() is called.
            throw new Error("No new model to restore");
        }

        return this.newModel;
    }
}
