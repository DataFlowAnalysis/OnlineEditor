import "reflect-metadata";

import {
    FunctionNodeView,
    IONodeView,
    StorageNodeView,
    ArrowEdgeView,
    ArrowEdge,
    FunctionNode,
    DfdLabelView,
    StorageNode,
    IONode,
} from "./views";
import { Container, ContainerModule } from "inversify";
import {
    AbstractUIExtension,
    ActionDispatcher,
    CenterGridSnapper,
    CommitModelAction,
    ConsoleLogger,
    CreateElementCommand,
    LocalModelSource,
    LogLevel,
    SGraph,
    SGraphView,
    SLabel,
    SRoutingHandle,
    SRoutingHandleView,
    SetUIExtensionVisibilityAction,
    TYPES,
    boundsModule,
    commandPaletteModule,
    configureCommand,
    configureModelElement,
    defaultModule,
    edgeEditModule,
    edgeLayoutModule,
    editLabelFeature,
    exportModule,
    hoverModule,
    labelEditModule,
    labelEditUiModule,
    modelSourceModule,
    moveModule,
    routingModule,
    selectModule,
    undoRedoModule,
    updateModule,
    viewportModule,
    withEditLabelFeature,
    zorderModule,
} from "sprotty";
import { DynamicChildrenProcessor } from "./dynamicChildren";
import { dfdLabelModule } from "./features/labels/di.config";
import { toolPaletteModule } from "./features/toolPalette/di.config";
import { serializeModule } from "./features/serialize/di.config";
import { LoadDefaultDiagramAction } from "./features/serialize/loadDefaultDiagram";
import { dfdCommonModule } from "./common/di.config";
import { EDITOR_TYPES } from "./utils";

import "sprotty/css/sprotty.css";
import "sprotty/css/edit-label.css";
import "./theme.css";
import "./page.css";

// Setup the Dependency Injection Container.
// This includes all used nodes, edges, listeners, etc. for sprotty.
const dataFlowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
    bind(TYPES.ISnapper).to(CenterGridSnapper);
    bind(DynamicChildrenProcessor).toSelf().inSingletonScope();

    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "graph", SGraph, SGraphView);
    configureModelElement(context, "node:storage", StorageNode, StorageNodeView);
    configureModelElement(context, "node:function", FunctionNode, FunctionNodeView);
    configureModelElement(context, "node:input-output", IONode, IONodeView);
    configureModelElement(context, "edge:arrow", ArrowEdge, ArrowEdgeView, {
        enable: [withEditLabelFeature],
    });
    configureModelElement(context, "label", SLabel, DfdLabelView, {
        enable: [editLabelFeature],
    });
    configureModelElement(context, "routing-point", SRoutingHandle, SRoutingHandleView);
    configureModelElement(context, "volatile-routing-point", SRoutingHandle, SRoutingHandleView);

    // For some reason the CreateElementAction and Command exist but in no sprotty module is the command registered, so we need to do this here.
    configureCommand(context, CreateElementCommand);
});

// Load the above defined module with all the used modules from sprotty.
const container = new Container();
// For reference: these are the modules used in the sprotty examples that can be used
// There may(?) be more modules available in sprotty but these are the most relevant ones
// container.load(
//     defaultModule, modelSourceModule, boundsModule, buttonModule,
//     commandPaletteModule, contextMenuModule, decorationModule, edgeEditModule,
//     edgeLayoutModule, expandModule, exportModule, fadeModule,
//     hoverModule, labelEditModule, labelEditUiModule, moveModule,
//     openModule, routingModule, selectModule, undoRedoModule,
//     updateModule, viewportModule, zorderModule, graphModule,
//     dataFlowDiagramModule
// );
container.load(
    // Sprotty modules
    // TODO: it is unclear what all these modules do *exactly* and would be good
    // to have a short description for each sprotty internal module
    defaultModule,
    modelSourceModule,
    boundsModule,
    viewportModule,
    moveModule,
    routingModule,
    selectModule,
    updateModule,
    zorderModule,
    undoRedoModule,
    labelEditModule,
    labelEditUiModule,
    edgeEditModule,
    exportModule,
    edgeLayoutModule,
    hoverModule,
    commandPaletteModule,

    // Custom modules
    dataFlowDiagramModule,
    dfdCommonModule,
    serializeModule,
    dfdLabelModule,
    toolPaletteModule,
);

const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
const dispatcher = container.get<ActionDispatcher>(TYPES.IActionDispatcher);
const defaultUIElements = container.getAll<AbstractUIExtension>(EDITOR_TYPES.DefaultUIElement);

// Load the initial root model
// Unless overwritten this the graph will be loaded into the DOM element with the id "sprotty".
modelSource
    .setModel({
        type: "graph",
        id: "root",
        children: [],
    })
    .then(() => {
        // Show the default uis after startup
        dispatcher.dispatchAll(
            defaultUIElements.map((uiElement) => {
                return SetUIExtensionVisibilityAction.create({
                    extensionId: uiElement.id(),
                    visible: true,
                });
            }),
        );

        // Load the default diagram and commit it to the model source.
        dispatcher.dispatch(LoadDefaultDiagramAction.create());
        dispatcher.dispatch(CommitModelAction.create());
    });
