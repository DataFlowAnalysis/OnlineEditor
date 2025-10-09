import { Container } from "inversify";
import    { loadDefaultModules, labelEditUiModule
} from "sprotty";

const container = new Container();

// Load default sprotty provided modules
loadDefaultModules(container, {
    exclude: [
        labelEditUiModule, // We provide our own label edit ui inheriting from the default one (noScrollLabelEditUiModule)
    ],
});