import "reflect-metadata";

import {
    FunctionNodeView,
    IONodeView,
    StorageNodeView,
    ArrowEdgeView,
    ArrowEdge,
    FunctionNode,
    DFDLabelView,
    StorageNode,
    IONode,
} from "./views";
import { Container, ContainerModule } from "inversify";
import {
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
    configureCommand,
    configureModelElement,
    defaultModule,
    edgeEditModule,
    edgeLayoutModule,
    editLabelFeature,
    exportModule,
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
import { toolsModules } from "./tools";
import { commandsModule } from "./commands/commands";
import { LoadDefaultDiagramAction } from "./commands/loadDefaultDiagram";
import { ToolPaletteUI } from "./tools/toolPalette";

import "sprotty/css/sprotty.css";
import "sprotty/css/edit-label.css";

import "./theme.css";
import "./page.css";
import { DynamicChildrenProcessor } from "./dynamicChildren";

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
    configureModelElement(context, "label", SLabel, DFDLabelView, {
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

    // Custom modules
    dataFlowDiagramModule,
    ...toolsModules,
    commandsModule,
);

const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
const dispatcher = container.get<ActionDispatcher>(TYPES.IActionDispatcher);

// Load the initial root model
// Unless overwritten this the graph will be loaded into the DOM element with the id "sprotty".
modelSource
    .setModel({
        type: "graph",
        id: "root",
        children: [],
    })
    .then(() => {
        // Show the tool palette after startup has completed.
        dispatcher.dispatch(
            SetUIExtensionVisibilityAction.create({
                extensionId: ToolPaletteUI.ID,
                visible: true,
            }),
        );

        // Load the default diagram and commit it to the model source.
        dispatcher.dispatch(LoadDefaultDiagramAction.create());
        dispatcher.dispatch(CommitModelAction.create());
    });
