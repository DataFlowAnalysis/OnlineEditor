import { ContainerModule, inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    LocalModelSource,
    TYPES,
    configureCommand,
    SShapeElement,
    SModelRoot,
} from "sprotty";
import {
    DefaultLayoutConfigurator,
    ElkFactory,
    ElkLayoutEngine,
    IElementFilter,
    ILayoutConfigurator,
} from "sprotty-elk";
import {
    Action,
    IModelLayoutEngine,
    SGraph,
    SModelIndex,
    SShapeElement as SShapeElementSchema,
} from "sprotty-protocol";
import { LayoutOptions, ElkShape } from "elkjs";
import ElkConstructor from "elkjs/lib/elk.bundled";
import { constructorInject } from "../../utils";

class DfdLayoutConfigurator extends DefaultLayoutConfigurator {
    protected override graphOptions(_sgraph: SGraph, _index: SModelIndex): LayoutOptions {
        return {
            "org.eclipse.elk.algorithm": "org.eclipse.elk.stress",
            "org.eclipse.elk.spacing.nodeNode": "45.0",
            "org.eclipse.elk.spacing.edgeLabel": "10.0",
            "org.eclipse.elk.edgeLabels.inline": "false",
            "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": "30.0",
        };
    }
}

const elkFactory = () =>
    new ElkConstructor({
        algorithms: ["stress"],
    });

@injectable()
class CustomElkLayoutEngine extends ElkLayoutEngine {
    constructor(
        @constructorInject(ElkFactory) elkFactory: ElkFactory,
        @constructorInject(IElementFilter) elementFilter: IElementFilter,
        @constructorInject(ILayoutConfigurator) configurator: ILayoutConfigurator,
    ) {
        super(elkFactory, elementFilter, configurator);
    }

    protected override transformShape(elkShape: ElkShape, sshape: SShapeElement | SShapeElementSchema): void {
        if (sshape.position) {
            elkShape.x = sshape.position.x;
            elkShape.y = sshape.position.y;
        }
        if ("bounds" in sshape) {
            elkShape.width = sshape.bounds.width ?? sshape.size.width;
            elkShape.height = sshape.bounds.height ?? sshape.size.height;
        }
    }
}

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

class LayoutModelCommand extends Command {
    static readonly KIND = LayoutModelAction.KIND;

    @inject(TYPES.IModelLayoutEngine)
    protected readonly layoutEngine?: IModelLayoutEngine;

    @inject(TYPES.ModelSource)
    protected readonly modelSource?: LocalModelSource;

    async execute(context: CommandExecutionContext): Promise<SModelRoot> {
        if (!this.layoutEngine || !this.modelSource) throw new Error("Missing injects");

        const newModel = this.layoutEngine.layout(context.root as unknown as SGraph);
        return (await newModel) as unknown as SModelRoot;
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    redo(context: CommandExecutionContext): Promise<SModelRoot> {
        return this.execute(context);
    }
}

export const dfdAutoLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(CustomElkLayoutEngine).toSelf().inSingletonScope();
    bind(TYPES.IModelLayoutEngine).toService(CustomElkLayoutEngine);
    rebind(ILayoutConfigurator).to(DfdLayoutConfigurator);
    bind(ElkFactory).toConstantValue(elkFactory);

    const context = { bind, unbind, isBound, rebind };

    configureCommand(context, LayoutModelCommand);
});
