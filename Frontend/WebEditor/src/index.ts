import "reflect-metadata";
import { TaskNode, TaskNodeSchema, TaskNodeView } from "./views";
import { Container, ContainerModule } from "inversify";
import { LocalModelSource, PolylineEdgeView, SEdge, SEdgeSchema, SGraph, SGraphFactory, SGraphSchema, SGraphView, TYPES, boundsModule, buttonModule, commandPaletteModule, configureModelElement, contextMenuModule, decorationModule, defaultModule, edgeEditModule, edgeLayoutModule, expandModule, exportModule, fadeModule, graphModule, hoverModule, labelEditModule, labelEditUiModule, modelSourceModule, moveModule, openModule, routingModule, selectModule, undoRedoModule, updateModule, viewportModule, zorderModule } from "sprotty";

const flowModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope();
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope()
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, 'graph', SGraph, SGraphView);
    configureModelElement(context, 'task', TaskNode, TaskNodeView);
    configureModelElement(context, 'edge', SEdge, PolylineEdgeView);
});

const container = new Container();
// container.load(defaultModule, selectModule, moveModule, boundsModule, undoRedoModule, viewportModule,
//     exportModule, updateModule, graphModule, routingModule, flowModule);
container.load(
    defaultModule, modelSourceModule, boundsModule, buttonModule,
    commandPaletteModule, contextMenuModule, decorationModule, edgeEditModule,
    edgeLayoutModule, expandModule, exportModule, fadeModule,
    hoverModule, labelEditModule, labelEditUiModule, moveModule,
    openModule, routingModule, selectModule, undoRedoModule,
    updateModule, viewportModule, zorderModule, graphModule,
    flowModule
);

const graph: SGraphSchema = {
    type: 'graph',
    id: 'root',
    children: [
        {
            type: 'task',
            id: 'task01',
            name: 'First Task',
            status: 'finished'
        } as TaskNodeSchema,
        {
            type: 'task',
            id: 'task02',
            name: 'Second Task',
            status: 'running'
        } as TaskNodeSchema,
        {
            type: 'edge',
            id: 'edge01',
            sourceId: 'task01',
            targetId: 'task02'
        } as SEdgeSchema
    ]
}

const modelSource = container.get<LocalModelSource>(TYPES.ModelSource)
modelSource.setModel(graph)