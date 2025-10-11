import { Container } from "inversify";
import { loadDefaultModules, labelEditUiModule } from "sprotty";
import "./assets/commonStyling.css"
import "./assets/page.css"
import "./assets/theme.css"
import { helpUiModule } from "./helpUi/di.config";
import { IStartUpAgent, StartUpAgent } from "./startUpAgent/StartUpAgent";
import { startUpAgentModule } from "./startUpAgent/di.config";
import { commonModule } from "./commonModule";

const container = new Container();

// Load default sprotty provided modules
loadDefaultModules(container, {
    exclude: [
        labelEditUiModule, // We provide our own label edit ui inheriting from the default one (noScrollLabelEditUiModule)
    ],
});

container.load(
    helpUiModule,
    commonModule,
    startUpAgentModule
)

const startUpAgents = container.getAll<IStartUpAgent>(StartUpAgent)
for (const startUpAgent of startUpAgents) {
    startUpAgent.run()
}
