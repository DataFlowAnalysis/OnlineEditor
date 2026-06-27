import { ContainerModule } from "inversify";
import { StartUpAgent } from "./StartUpAgent";
import { LoadDefaultUiExtensionsStartUpAgent } from "./LoadDefaultUiExtensions";
import { LoadDefaultDiagramStartUpAgent } from "./LoadDefaultDiagram";
import { SettingsInitStartUpAgent } from "./settingsInit";
import { FocusContainerCommand, FocusContainerStartUpAgent } from "./FocusContainer";
import { configureCommand } from "sprotty";

export const startUpAgentModule = new ContainerModule((bind, _, isBound) => {
    bind(StartUpAgent).to(LoadDefaultUiExtensionsStartUpAgent);
    bind(StartUpAgent).to(LoadDefaultDiagramStartUpAgent);
    bind(StartUpAgent).to(SettingsInitStartUpAgent);
    bind(StartUpAgent).to(FocusContainerStartUpAgent);
    configureCommand({ bind, isBound }, FocusContainerCommand);
});
