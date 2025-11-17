import { ContainerModule } from "inversify";
import { configureActionHandler, configureModelElement, EditLabelAction, EditLabelActionHandler, editLabelFeature, SGraphImpl, SGraphView, SLabelImpl, SLabelView, SRoutingHandleImpl, TYPES, withEditLabelFeature } from "sprotty";
import { ArrowEdgeImpl, ArrowEdgeView, CustomRoutingHandleView } from "./edges/ArrowEdge";
import { DfdInputPortImpl, DfdInputPortView } from "./ports/DfdInputPort";
import { DfdOutputPortImpl, DfdOutputPortView } from "./ports/DfdOutputPort";
import { StorageNodeImpl, StorageNodeView } from "./nodes/DfdStorageNode";
import { FunctionNodeImpl, FunctionNodeView } from "./nodes/DfdFunctionNode";
import { IONodeImpl, IONodeView } from "./nodes/DfdIONode";
import './style.css'
import { DfdPositionalLabelView } from "./labels/DfdPositionalLabel";
import { DfdNodeLabelRenderer } from "./nodes/DfdNodeLabels";
import { FilledBackgroundLabelView } from "./labels/FilledBackgroundLabel";
import { DfdEditLabelValidatorDecorator } from "./labels/EditLabelDecorator";
import { DfdEditLabelValidator } from "./labels/EditLabelValidator";
import { NoScrollEditLabelUI } from "./labels/NoScrollEditLabelUI";

export const diagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    
    bind(TYPES.IEditLabelValidator).to(DfdEditLabelValidator).inSingletonScope();
    bind(TYPES.IEditLabelValidationDecorator).to(DfdEditLabelValidatorDecorator).inSingletonScope();
    configureActionHandler(context, EditLabelAction.KIND, EditLabelActionHandler);
        bind(NoScrollEditLabelUI).toSelf().inSingletonScope();
        bind(TYPES.IUIExtension).toService(NoScrollEditLabelUI);

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
    configureModelElement(context, "label:filled-background", SLabelImpl, FilledBackgroundLabelView, {
        enable: [editLabelFeature],
    });

    bind(DfdNodeLabelRenderer).toSelf().inSingletonScope()

});