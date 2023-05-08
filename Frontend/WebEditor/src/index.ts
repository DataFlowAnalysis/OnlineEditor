import "reflect-metadata";
import "./page.css";
import {
    FunctionNode,
    FunctionNodeSchema,
    FunctionNodeView,
    StorageNode,
    StorageNodeSchema,
    StorageNodeView,
} from "./views";
import { Container, ContainerModule } from "inversify";
import { SEdge as SEdgeSchema, SGraph as SGraphSchema } from "sprotty-protocol";
import {
    LocalModelSource,
    PolylineEdgeView,
    SEdge,
    SGraph,
    SGraphView,
    TYPES,
    boundsModule,
    configureModelElement,
    defaultModule,
    modelSourceModule,
    moveModule,
    routingModule,
    selectModule,
    viewportModule,
    zorderModule,
} from "sprotty";

const taskModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "graph", SGraph, SGraphView);
    configureModelElement(context, "storage", StorageNode, StorageNodeView);
    configureModelElement(context, "function", FunctionNode, FunctionNodeView);
    configureModelElement(context, "edge", SEdge, PolylineEdgeView);
});

const container = new Container();
// container.load(
//     defaultModule, modelSourceModule, boundsModule, buttonModule,
//     commandPaletteModule, contextMenuModule, decorationModule, edgeEditModule,
//     edgeLayoutModule, expandModule, exportModule, fadeModule,
//     hoverModule, labelEditModule, labelEditUiModule, moveModule,
//     openModule, routingModule, selectModule, undoRedoModule,
//     updateModule, viewportModule, zorderModule, graphModule,
//     taskModule
// );
container.load(
    defaultModule,
    modelSourceModule,
    boundsModule,
    viewportModule,
    moveModule,
    routingModule,
    selectModule,
    zorderModule,
    taskModule,
);

const graph: SGraphSchema = {
    type: "graph",
    id: "root",
    children: [
        {
            type: "storage",
            id: "storage01",
            name: "TestDB",
            position: { x: 100, y: 100 },
        } as StorageNodeSchema,
        {
            type: "function",
            id: "function01",
            name: "TestFunction",
            position: { x: 200, y: 200 },
        } as FunctionNodeSchema,
        {
            type: "edge",
            id: "edge01",
            sourceId: "storage01",
            targetId: "function01",
        } as SEdgeSchema,
    ],
};

const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
modelSource.setModel(graph);
