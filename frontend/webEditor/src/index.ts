import "reflect-metadata";
import { Container } from "inversify";
import { loadDefaultModules, labelEditUiModule } from "sprotty";
import "sprotty/css/sprotty.css";
import "./assets/commonStyling.css"
import "./assets/page.css"
import "./assets/theme.css"
import "@vscode/codicons/dist/codicon.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { helpUiModule } from "./helpUi/di.config";
import { IStartUpAgent, StartUpAgent } from "./startUpAgent/StartUpAgent";
import { startUpAgentModule } from "./startUpAgent/di.config";
import { commonModule } from "./commonModule";
import { labelModule } from "./labels/di.config";
import { serializeModule } from "./serialize/di.config";
import { diagramModule } from "./diagram/di.config";
import { webSocketModule } from "./webSocket/di.config";
import { commandPaletteModule } from "./commandPalette/di.config";
import { layoutModule } from "./layout/di.config";
import { elkLayoutModule } from "sprotty-elk";
import { fileNameModule } from "./fileName/di.config";
import { settingsModule } from "./settings/di.config";
import { toolPaletteModule } from "./toolPalette/di.config";
import { constraintModule } from "./constraint/di.config";
import { assignmentModule } from "./assignment/di.config";

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
    diagramModule,
    serializeModule,
    webSocketModule,
    commandPaletteModule,
    elkLayoutModule,
    layoutModule,
    fileNameModule,
    settingsModule,
    toolPaletteModule,
    constraintModule,
    assignmentModule
)

const startUpAgents = container.getAll<IStartUpAgent>(StartUpAgent)
for (const startUpAgent of startUpAgents) {
    startUpAgent.run()
}
