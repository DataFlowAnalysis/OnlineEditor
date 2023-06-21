import "reflect-metadata";

import {
    FunctionNodeView,
    IONodeView,
    StorageNodeView,
    ArrowEdgeView,
    ArrowEdge,
    DFDNodeSchema,
    RectangularDFDNode,
    CircularDFDNode,
} from "./views";
import { Container, ContainerModule } from "inversify";
import { SEdge as SEdgeSchema, SGraph as SGraphSchema, SLabel as SLabelSchema } from "sprotty-protocol";
import {
    ActionDispatcher,
    CenterGridSnapper,
    ConsoleLogger,
    CreateElementCommand,
    LocalModelSource,
    LogLevel,
    SGraph,
    SGraphView,
    SLabel,
    SLabelView,
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
import { ToolPaletteUI } from "./tools/toolPalette";
import { ExpanderModelSource } from "./modelSource";

import "sprotty/css/sprotty.css";
import "sprotty/css/edit-label.css";

import "./theme.css";
import "./page.css";

// Setup the Dependency Injection Container.
// This includes all used nodes, edges, listeners, etc. for sprotty.
const dataFlowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TYPES.ModelSource).to(ExpanderModelSource).inSingletonScope();
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
    bind(TYPES.ISnapper).to(CenterGridSnapper);

    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "graph", SGraph, SGraphView);
    configureModelElement(context, "node:storage", RectangularDFDNode, StorageNodeView);
    configureModelElement(context, "node:function", CircularDFDNode, FunctionNodeView);
    configureModelElement(context, "node:input-output", RectangularDFDNode, IONodeView);
    configureModelElement(context, "edge:arrow", ArrowEdge, ArrowEdgeView, {
        enable: [withEditLabelFeature],
    });
    configureModelElement(context, "label", SLabel, SLabelView, {
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

// Construct the diagram graph state that should be shown.
const graph: SGraphSchema = {
    type: "graph",
    id: "root",
    children: [
        {
            type: "node:storage",
            id: "storage01",
            text: "Database",
            position: { x: 100, y: 100 },
            size: { width: 60, height: 30 },
        } as DFDNodeSchema,
        {
            type: "node:function",
            id: "function01",
            text: "System",
            position: { x: 200, y: 200 },
            size: { width: 50, height: 50 },
        } as DFDNodeSchema,
        {
            type: "node:input-output",
            id: "input01",
            text: "Customer",
            position: { x: 325, y: 205 },
            size: { width: 70, height: 40 },
        } as DFDNodeSchema,

        {
            type: "edge:arrow",
            id: "edge01",
            sourceId: "storage01",
            targetId: "function01",
            children: [
                {
                    type: "label",
                    id: "label01",
                    text: "Input",
                    edgePlacement: {
                        position: 0.5,
                        side: "on",
                        rotate: false,
                    },
                } as SLabelSchema,
            ],
        } as SEdgeSchema,
        {
            type: "edge:arrow",
            id: "edge02",
            sourceId: "function01",
            targetId: "input01",
            children: [
                {
                    type: "label",
                    id: "label02",
                    text: "",
                    edgePlacement: {
                        position: 0.5,
                        side: "on",
                        rotate: false,
                    },
                } as SLabelSchema,
            ],
        } as SEdgeSchema,
    ],
};

// Load the graph into the model source and display it inside the DOM.
// Unless overwritten this will load the graph into the DOM element with the id "sprotty".
const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
const dispatcher = container.get<ActionDispatcher>(TYPES.IActionDispatcher);

modelSource.model = graph;
console.log("Sprotty model set.");

// Show the tool palette after startup has completed.
dispatcher.dispatch(
    SetUIExtensionVisibilityAction.create({
        extensionId: ToolPaletteUI.ID,
        visible: true,
    }),
);
