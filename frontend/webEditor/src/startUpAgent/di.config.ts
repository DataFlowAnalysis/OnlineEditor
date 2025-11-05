import { ContainerModule } from "inversify";
import { StartUpAgent } from "./StartUpAgent";
import { LoadDefaultUiExtensionsStartUpAgent } from "./LoadDefaultUiExtensions";
import { LoadDefaultDiagramStartUpAgent } from "./LoadDefaultDiagram";
import { WebSocketConnectStartUpAgent } from "./webSocketConnect";

export const startUpAgentModule = new ContainerModule((bind) => {
    bind(StartUpAgent).to(LoadDefaultUiExtensionsStartUpAgent)
    bind(StartUpAgent).to(LoadDefaultDiagramStartUpAgent)  
    bind(StartUpAgent).to(WebSocketConnectStartUpAgent)
})