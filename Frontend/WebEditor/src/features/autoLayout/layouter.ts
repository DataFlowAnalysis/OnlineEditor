import ElkConstructor from "elkjs/lib/elk.bundled";
import { injectable } from "inversify";
import {
    DefaultLayoutConfigurator,
    ElkFactory,
    ElkLayoutEngine,
    IElementFilter,
    ILayoutConfigurator,
} from "sprotty-elk";
import { constructorInject } from "../../utils";
import { SShapeElement } from "sprotty";
import { SShapeElement as SShapeElementSchema, SGraph, SModelIndex } from "sprotty-protocol";
import { ElkShape, LayoutOptions } from "elkjs";

export class DfdLayoutConfigurator extends DefaultLayoutConfigurator {
    protected override graphOptions(_sgraph: SGraph, _index: SModelIndex): LayoutOptions {
        // Elk settings. See https://eclipse.dev/elk/reference.html for available options.
        return {
            "org.eclipse.elk.algorithm": "org.eclipse.elk.layered",
            "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": "30.0",
            "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": "30.0",
            // Do not do micro layout for nodes, which includes the node dimensions etc.
            // These are all automatically determined by our dfd node views
            "org.eclipse.elk.omitNodeMicroLayout": "true",
        };
    }
}

export const elkFactory = () =>
    new ElkConstructor({
        algorithms: ["layered"],
    });

/**
 * Layout engine for the DFD editor.
 * This class inherits the default ElkLayoutEngine but overrides the transformShape method.
 * This is necessary because the default ElkLayoutEngine uses the size property of the shapes to determine their sizes.
 * However with dynamically sized shapes, the size property is set to -1, which is undesired.
 * Instead in this case the size should be determined by the bounds property which is dynamically computed.
 */
@injectable()
export class DfdElkLayoutEngine extends ElkLayoutEngine {
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
