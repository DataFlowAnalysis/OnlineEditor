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
    TYPES,
    configureCommand,
} from "sprotty";
import { FunctionNodeImpl, FunctionNodeView, IONodeImpl, IONodeView, StorageNodeImpl, StorageNodeView } from "./nodes";
import { ArrowEdgeImpl, ArrowEdgeView } from "./edges";
import { DfdInputPortImpl, DfdInputPortView, DfdOutputPortImpl, DfdOutputPortView } from "./ports";
import { FilledBackgroundLabelView, DfdPositionalLabelView } from "./labels";
import { PortAwareSnapper } from "./portSnapper";
import { OutputPortEditUIMouseListener, OutputPortEditUI, SetDfdOutputPortBehaviourCommand } from "./outputPortEditUi";

import "./styles.css";

export const dfdElementsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    rebind(TYPES.ISnapper).to(PortAwareSnapper).inSingletonScope();

    bind(TYPES.IUIExtension).to(OutputPortEditUI).inSingletonScope();
    bind(TYPES.MouseListener).to(OutputPortEditUIMouseListener).inSingletonScope();
    configureCommand(context, SetDfdOutputPortBehaviourCommand);

    configureModelElement(context, "graph", SGraphImpl, SGraphView);
    configureModelElement(context, "node:storage", StorageNodeImpl, StorageNodeView);
    configureModelElement(context, "node:function", FunctionNodeImpl, FunctionNodeView);
    configureModelElement(context, "node:input-output", IONodeImpl, IONodeView);
    configureModelElement(context, "edge:arrow", ArrowEdgeImpl, ArrowEdgeView, {
        enable: [withEditLabelFeature],
    });
    configureModelElement(context, "label", SLabelImpl, SLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "label:filled-background", SLabelImpl, FilledBackgroundLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "label:positional", SLabelImpl, DfdPositionalLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "port:dfd-input", DfdInputPortImpl, DfdInputPortView);
    configureModelElement(context, "port:dfd-output", DfdOutputPortImpl, DfdOutputPortView);
    configureModelElement(context, "routing-point", SRoutingHandleImpl, SRoutingHandleView);
    configureModelElement(context, "volatile-routing-point", SRoutingHandleImpl, SRoutingHandleView);
});
