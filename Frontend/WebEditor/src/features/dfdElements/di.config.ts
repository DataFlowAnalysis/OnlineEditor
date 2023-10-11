import { ContainerModule } from "inversify";
import {
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    configureModelElement,
    editLabelFeature,
    withEditLabelFeature,
    SLabelView,
    SRoutingHandleImpl,
    TYPES,
    configureCommand,
} from "sprotty";
import { FunctionNodeImpl, FunctionNodeView, IONodeImpl, IONodeView, StorageNodeImpl, StorageNodeView } from "./nodes";
import { ArrowEdgeImpl, ArrowEdgeView, CustomRoutingHandleView } from "./edges";
import { DfdInputPortImpl, DfdInputPortView, DfdOutputPortImpl, DfdOutputPortView } from "./ports";
import { FilledBackgroundLabelView, DfdPositionalLabelView } from "./labels";
import { AlwaysSnapPortsMoveMouseListener, PortAwareSnapper } from "./portSnapper";
import { OutputPortEditUIMouseListener, OutputPortEditUI, SetDfdOutputPortBehaviorCommand } from "./outputPortEditUi";
import { DfdEditLabelValidator, DfdEditLabelValidatorDecorator } from "./editLabelValidator";

import "./elementStyles.css";

export const dfdElementsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    rebind(TYPES.ISnapper).to(PortAwareSnapper).inSingletonScope();
    bind(TYPES.MouseListener).to(AlwaysSnapPortsMoveMouseListener).inSingletonScope();

    bind(TYPES.IUIExtension).to(OutputPortEditUI).inSingletonScope();
    bind(TYPES.MouseListener).to(OutputPortEditUIMouseListener).inSingletonScope();
    configureCommand(context, SetDfdOutputPortBehaviorCommand);

    bind(TYPES.IEditLabelValidator).to(DfdEditLabelValidator).inSingletonScope();
    bind(TYPES.IEditLabelValidationDecorator).to(DfdEditLabelValidatorDecorator).inSingletonScope();

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
    configureModelElement(context, "routing-point", SRoutingHandleImpl, CustomRoutingHandleView);
    configureModelElement(context, "volatile-routing-point", SRoutingHandleImpl, CustomRoutingHandleView);
});
