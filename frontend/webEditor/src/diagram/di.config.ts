import { ContainerModule } from "inversify";
import { configureModelElement, SGraphImpl, SGraphView } from "sprotty";

export const diagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    configureModelElement(context, "graph", SGraphImpl, SGraphView);
});