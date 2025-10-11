import { ContainerModule } from "inversify";
import { StartUpAgent } from "./StartUpAgent";
import { LoadDefaultUiExtensionsStartUpAgent } from "./LoadDefaultUiExtensions";

export const startUpAgentModule = new ContainerModule((bind) => {
    bind(StartUpAgent).to(LoadDefaultUiExtensionsStartUpAgent)
    
})