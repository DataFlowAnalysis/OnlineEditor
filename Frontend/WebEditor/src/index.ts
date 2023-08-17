import "reflect-metadata";

import { Container } from "inversify";
import {
    AbstractUIExtension,
    ActionDispatcher,
    CommitModelAction,
    SetUIExtensionVisibilityAction,
    TYPES,
    boundsModule,
    commandPaletteModule,
    defaultModule,
    edgeEditModule,
    edgeLayoutModule,
    exportModule,
    hoverModule,
    labelEditModule,
    labelEditUiModule,
    modelSourceModule,
    moveModule,
    routingModule,
    selectModule,
    undoRedoModule,
    updateModule,
    viewportModule,
    zorderModule,
} from "sprotty";
import { elkLayoutModule } from "sprotty-elk";
import { dfdAutoLayoutModule } from "./features/autoLayout/di.config";
import { dfdCommonModule } from "./common/di.config";
import { dfdLabelModule } from "./features/labels/di.config";
import { toolPaletteModule } from "./features/toolPalette/di.config";
import { serializeModule } from "./features/serialize/di.config";
import { LoadDefaultDiagramAction } from "./features/serialize/loadDefaultDiagram";
import { dfdElementsModule } from "./features/dfdElements/di.config";
import { EDITOR_TYPES } from "./utils";

import "sprotty/css/sprotty.css";
import "sprotty/css/edit-label.css";
import "./theme.css";
import "./page.css";

// Load required sprotty and custom modules.
const container = new Container();
// For reference: these are the modules used in the sprotty examples that can be used
// There may(?) be more modules available in sprotty but these are the most relevant ones
// container.load(
//     defaultModule, modelSourceModule, boundsModule, buttonModule,
//     commandPaletteModule, contextMenuModule, decorationModule, edgeEditModule,
//     edgeLayoutModule, expandModule, exportModule, fadeModule,
//     hoverModule, labelEditModule, labelEditUiModule, moveModule,
//     openModule, routingModule, selectModule, undoRedoModule,
//     updateModule, viewportModule, zorderModule, graphModule,
// );
container.load(
    // Sprotty modules, will create a sprotty diagram inside the html element with id "sprotty" by default
    // TODO: it is unclear what all these modules do *exactly* and would be good
    // to have a short description for each sprotty internal module
    defaultModule,
    modelSourceModule,
    boundsModule,
    viewportModule,
    moveModule,
    routingModule,
    selectModule,
    updateModule,
    zorderModule,
    undoRedoModule,
    labelEditModule,
    labelEditUiModule,
    edgeEditModule,
    exportModule,
    edgeLayoutModule,
    hoverModule,
    commandPaletteModule,
    elkLayoutModule,

    // Custom modules
    dfdCommonModule,
    dfdAutoLayoutModule,
    dfdElementsModule,
    serializeModule,
    dfdLabelModule,
    toolPaletteModule,
);

const dispatcher = container.get<ActionDispatcher>(TYPES.IActionDispatcher);
const defaultUIElements = container.getAll<AbstractUIExtension>(EDITOR_TYPES.DefaultUIElement);

// Show the default uis after startup
dispatcher.dispatchAll(
    defaultUIElements.map((uiElement) => {
        return SetUIExtensionVisibilityAction.create({
            extensionId: uiElement.id(),
            visible: true,
        });
    }),
);

// Then load the default diagram and commit the temporary model to the model source
dispatcher.dispatch(LoadDefaultDiagramAction.create());
dispatcher.dispatch(CommitModelAction.create());
