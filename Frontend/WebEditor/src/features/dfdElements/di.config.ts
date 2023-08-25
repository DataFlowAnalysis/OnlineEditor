import { ContainerModule } from "inversify";
import {
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SRoutingHandleView,
    configureModelElement,
    editLabelFeature,
    withEditLabelFeature,
    SLabelView,
    SRoutingHandleImpl,
} from "sprotty";
import {
    DfdPositionalLabelView,
    FunctionNode,
    FunctionNodeView,
    IONode,
    IONodeView,
    StorageNode,
    StorageNodeView,
} from "./nodes";
import { ArrowEdgeImpl, ArrowEdgeView } from "./edges";

import "./styles.css";

export const dfdElementsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "graph", SGraphImpl, SGraphView);
    configureModelElement(context, "node:storage", StorageNode, StorageNodeView);
    configureModelElement(context, "node:function", FunctionNode, FunctionNodeView);
    configureModelElement(context, "node:input-output", IONode, IONodeView);
    configureModelElement(context, "edge:arrow", ArrowEdgeImpl, ArrowEdgeView, {
        enable: [withEditLabelFeature],
    });
    configureModelElement(context, "label", SLabelImpl, SLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "label:positional", SLabelImpl, DfdPositionalLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "routing-point", SRoutingHandleImpl, SRoutingHandleView);
    configureModelElement(context, "volatile-routing-point", SRoutingHandleImpl, SRoutingHandleView);
});
