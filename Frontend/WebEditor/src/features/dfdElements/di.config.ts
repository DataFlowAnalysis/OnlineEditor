import { ContainerModule } from "inversify";
import {
    SGraph,
    SGraphView,
    SLabel,
    SRoutingHandle,
    SRoutingHandleView,
    configureModelElement,
    editLabelFeature,
    withEditLabelFeature,
    SLabelView,
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
import { ArrowEdge, ArrowEdgeView } from "./edges";

import "./styles.css";

export const dfdElementsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "graph", SGraph, SGraphView);
    configureModelElement(context, "node:storage", StorageNode, StorageNodeView);
    configureModelElement(context, "node:function", FunctionNode, FunctionNodeView);
    configureModelElement(context, "node:input-output", IONode, IONodeView);
    configureModelElement(context, "edge:arrow", ArrowEdge, ArrowEdgeView, {
        enable: [withEditLabelFeature],
    });
    configureModelElement(context, "label", SLabel, SLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "label:positional", SLabel, DfdPositionalLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "routing-point", SRoutingHandle, SRoutingHandleView);
    configureModelElement(context, "volatile-routing-point", SRoutingHandle, SRoutingHandleView);
});
