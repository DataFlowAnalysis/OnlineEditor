import { TYPES, configureCommand } from "sprotty";
import { LoadDiagramCommand } from "./load";
import { SaveDiagramCommand } from "./save";
import { LoadDefaultDiagramCommand } from "./loadDefaultDiagram";
import { ContainerModule } from "inversify";
import { SerializeKeyListener } from "./keyListener";
import { SerializeDropHandler } from "./dropListener";

export const serializeModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureCommand(context, LoadDiagramCommand);
    configureCommand(context, LoadDefaultDiagramCommand);
    configureCommand(context, SaveDiagramCommand);

    bind(TYPES.KeyListener).to(SerializeKeyListener).inSingletonScope();
    bind(TYPES.MouseListener).to(SerializeDropHandler).inSingletonScope();
});
