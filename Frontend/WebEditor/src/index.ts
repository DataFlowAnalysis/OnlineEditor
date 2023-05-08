import "reflect-metadata";
import "./page.css";
import { StorageNode, StorageNodeSchema, StorageNodeView, TaskNode, TaskNodeSchema, TaskNodeView } from "./views";
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
    configureModelElement(context, "task", TaskNode, TaskNodeView);
    configureModelElement(context, "storage", StorageNode, StorageNodeView);
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
            type: "task",
            id: "task01",
            name: "First Task",
            status: "finished",
        } as TaskNodeSchema,
        {
            type: "task",
            id: "task02",
            name: "Second Task",
            status: "running",
        } as TaskNodeSchema,
        {
            type: "edge",
            id: "edge01",
            sourceId: "task01",
            targetId: "task02",
        } as SEdgeSchema,
        {
            type: "storage",
            id: "storage01",
            name: "TestDB",
            position: { x: 100, y: 100 },
        } as StorageNodeSchema,
    ],
};

const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
modelSource.setModel(graph);
