import { ContainerModule } from "inversify";
import { DfdWebSocket } from "./webSocket";

export const webSocketModule = new ContainerModule((bind) => {
    bind(DfdWebSocket).toSelf().inSingletonScope();
});
