import "reflect-metadata";

import "./page.css";
import "sprotty/css/sprotty.css";

import {
    FunctionNode,
    FunctionNodeSchema,
    FunctionNodeView,
    IONode,
    IONodeSchema,
    IONodeView,
    StorageNode,
    StorageNodeSchema,
    StorageNodeView,
} from "./views";
import { Container, ContainerModule, inject, injectable } from "inversify";
import { SEdge as SEdgeSchema, SGraph as SGraphSchema, Action, SNode as SNodeSchema } from "sprotty-protocol";
import {
    LocalModelSource,
    MouseListener,
    PolylineEdgeView,
    SEdge,
    SGraph,
    SGraphView,
    SModelElement,
    TYPES,
    boundsModule,
    configureModelElement,
    defaultModule,
    modelSourceModule,
    moveModule,
    routingModule,
    selectModule,
    updateModule,
    viewportModule,
    zorderModule,
} from "sprotty";

// Setup the Dependency Injection Container.
// This includes all used nodes, edges, listeners, etc. for sprotty.
const dataFlowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    bind(DroppableMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(DroppableMouseListener);
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "graph", SGraph, SGraphView);
    configureModelElement(context, "storage", StorageNode, StorageNodeView);
    configureModelElement(context, "function", FunctionNode, FunctionNodeView);
    configureModelElement(context, "input-output", IONode, IONodeView);
    configureModelElement(context, "edge", SEdge, PolylineEdgeView);
});

@injectable()
class DroppableMouseListener extends MouseListener {
    @inject(TYPES.ModelSource) modelSource?: LocalModelSource;

    override dragOver(_target: SModelElement, event: DragEvent): (Action | Promise<Action>)[] {
        event.preventDefault();
        return [];
    }

    override drop(_target: SModelElement, event: DragEvent): (Action | Promise<Action>)[] {
        const nodeDataString = event.dataTransfer?.getData("text/plain");
        const nodeData: SNodeSchema = nodeDataString ? JSON.parse(nodeDataString) : undefined;
        if (!nodeData) {
            return [];
        }

        modelSource.getViewport().then((viewport) => {
            if (!nodeData.size) {
                nodeData.size = {
                    width: 10,
                    height: 10,
                };
            }

            const adjust = (offset: number, size: number) => {
                return offset / viewport.zoom - size / 2;
            };
            nodeData.position = {
                x: viewport.scroll.x + adjust(event.offsetX, nodeData.size.width),
                y: viewport.scroll.y + adjust(event.offsetY, nodeData.size.height),
            };
            modelSource.addElements([nodeData]);
        });

        return [];
    }
}

// Load the above defined module with all the used modules from sprotty.
const container = new Container();
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
    defaultModule,
    modelSourceModule,
    boundsModule,
    viewportModule,
    moveModule,
    routingModule,
    selectModule,
    updateModule,
    zorderModule,
    dataFlowDiagramModule,
);

// Construct the diagram graph state that should be shown.
const graph: SGraphSchema = {
    type: "graph",
    id: "root",
    children: [
        {
            type: "storage",
            id: "storage01",
            name: "TestDB",
            position: { x: 100, y: 100 },
            size: { width: 60, height: 30 },
        } as StorageNodeSchema,
        {
            type: "function",
            id: "function01",
            name: "TestFunction",
            position: { x: 200, y: 200 },
            size: { width: 40, height: 40 },
        } as FunctionNodeSchema,
        {
            type: "input-output",
            id: "input01",
            name: "TestInput",
            position: { x: 300, y: 300 },
            size: { width: 60, height: 40 },
        } as IONodeSchema,

        {
            type: "edge",
            id: "edge01",
            sourceId: "storage01",
            targetId: "function01",
        } as SEdgeSchema,
        {
            type: "edge",
            id: "edge02",
            sourceId: "function01",
            targetId: "input01",
        } as SEdgeSchema,
    ],
};

// Load the graph into the model source and display it inside the DOM.
// Unless overwritten this will load the graph into the DOM element with the id "sprotty".
const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
modelSource
    .setModel(graph)
    .then(() => console.log("Sprotty model set."))
    .catch((reason) => console.error(reason));
