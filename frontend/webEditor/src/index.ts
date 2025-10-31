import "reflect-metadata";
import { Container } from "inversify";
import { loadDefaultModules, labelEditUiModule } from "sprotty";
import "sprotty/css/sprotty.css";
import "./assets/commonStyling.css"
import "./assets/page.css"
import "./assets/theme.css"
import "@vscode/codicons/dist/codicon.css";
import { helpUiModule } from "./helpUi/di.config";
import { IStartUpAgent, StartUpAgent } from "./startUpAgent/StartUpAgent";
import { startUpAgentModule } from "./startUpAgent/di.config";
import { commonModule } from "./commonModule";
import { labelModule } from "./labels/di.config";
import { serializeModule } from "./serialize/di.config";
import { editorModeModule } from "./editorMode/di.config";
import { diagramModule } from "./diagram/di.config";

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
    startUpAgentModule,
    labelModule,
    editorModeModule,
    diagramModule,
    serializeModule
)

const startUpAgents = container.getAll<IStartUpAgent>(StartUpAgent)
for (const startUpAgent of startUpAgents) {
    startUpAgent.run()
}
