import { ContainerModule } from "inversify";
import { StartUpAgent } from "./StartUpAgent";
import { LoadDefaultUiExtensionsStartUpAgent } from "./LoadDefaultUiExtensions";
import { LoadDefaultDiagramStartUpAgent } from "./LoadDefaultDiagram";
import { SprottyInitializerStartUpAgent } from "./SprottyInit";

export const startUpAgentModule = new ContainerModule((bind) => {
    bind(StartUpAgent).to(LoadDefaultUiExtensionsStartUpAgent)
    bind(StartUpAgent).to(SprottyInitializerStartUpAgent)
    bind(StartUpAgent).to(LoadDefaultDiagramStartUpAgent)  
})