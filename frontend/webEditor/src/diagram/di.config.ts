import { ContainerModule } from "inversify";
import { configureModelElement, editLabelFeature, SGraphImpl, SGraphView, SLabelImpl, SLabelView, SRoutingHandleImpl, withEditLabelFeature } from "sprotty";
import { ArrowEdgeImpl, ArrowEdgeView, CustomRoutingHandleView } from "./edges/ArrowEdge";
import { DfdInputPortImpl, DfdInputPortView } from "./ports/DfdInputPort";
import { DfdOutputPortImpl, DfdOutputPortView } from "./ports/DfdOutputPort";
import { StorageNodeImpl, StorageNodeView } from "./nodes/DfdStorageNode";
import { FunctionNodeImpl, FunctionNodeView } from "./nodes/DfdFunctionNode";
import { IONodeImpl, IONodeView } from "./nodes/DfdIONode";
import './style.css'
import { DfdPositionalLabelView } from "./labels/DfdPositionalLabel";
import { DfdNodeLabelRenderer } from "./nodes/DfdNodeLabels";

export const diagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    configureModelElement(context, "graph", SGraphImpl, SGraphView);

    configureModelElement(context, "node:storage", StorageNodeImpl, StorageNodeView);
    configureModelElement(context, "node:function", FunctionNodeImpl, FunctionNodeView);
    configureModelElement(context, "node:input-output", IONodeImpl, IONodeView);

    configureModelElement(context, "edge:arrow", ArrowEdgeImpl, ArrowEdgeView, {
        enable: [withEditLabelFeature],
    });
    configureModelElement(context, "routing-point", SRoutingHandleImpl, CustomRoutingHandleView);
    configureModelElement(context, "volatile-routing-point", SRoutingHandleImpl, CustomRoutingHandleView);

    configureModelElement(context, "port:dfd-input", DfdInputPortImpl, DfdInputPortView);
    configureModelElement(context, "port:dfd-output", DfdOutputPortImpl, DfdOutputPortView);

    configureModelElement(context, "label", SLabelImpl, SLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "label:positional", SLabelImpl, DfdPositionalLabelView, {
        enable: [editLabelFeature],
    });

    bind(DfdNodeLabelRenderer).toSelf().inSingletonScope()
});