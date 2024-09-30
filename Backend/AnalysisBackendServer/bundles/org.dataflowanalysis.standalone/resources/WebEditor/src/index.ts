import "reflect-metadata";

import { Container } from "inversify";
import {
    AbstractUIExtension,
    ActionDispatcher,
    CommitModelAction,
    LocalModelSource,
    SetUIExtensionVisibilityAction,
    TYPES,
    labelEditUiModule,
    loadDefaultModules,
    IActionHandlerRegistry
} from "sprotty";
import { elkLayoutModule } from "sprotty-elk";
import { autoLayoutModule } from "./features/autoLayout/di.config";
import { commonModule } from "./common/di.config";
import { noScrollLabelEditUiModule } from "./common/labelEditNoScroll";
import { dfdLabelModule } from "./features/labels/di.config";
import { customActionModule, toolPaletteModule } from "./features/toolPalette/di.config";
import { serializeModule } from "./features/serialize/di.config";
import { LoadDefaultDiagramAction } from "./features/serialize/loadDefaultDiagram";
import { dfdElementsModule } from "./features/dfdElements/di.config";
import { copyPasteModule } from "./features/copyPaste/di.config";
import { EDITOR_TYPES } from "./utils";
import { editorModeModule } from "./features/editorMode/di.config";

import "sprotty/css/sprotty.css";
import "sprotty/css/edit-label.css";
import "./theme.css";
import "./page.css";
import { LoadDiagramAction } from "./features/serialize/load";




const container = new Container();

// Load default sprotty provided modules
loadDefaultModules(container, {
    exclude: [
        labelEditUiModule, // We provide our own label edit ui inheriting from the default one (noScrollLabelEditUiModule)
    ],
});


// sprotty-elk layouting extension
container.load(elkLayoutModule);

// Custom modules that we provide ourselves
container.load(
    commonModule,
    noScrollLabelEditUiModule,
    autoLayoutModule,
    dfdElementsModule,
    serializeModule,
    dfdLabelModule,
    editorModeModule,
    toolPaletteModule,
    copyPasteModule,
);

const dispatcher = container.get<ActionDispatcher>(TYPES.IActionDispatcher);
const defaultUIElements = container.getAll<AbstractUIExtension>(EDITOR_TYPES.DefaultUIElement);
const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
// Set empty model as starting point.
// In contrast to the default diagram later this is not undoable which would bring the editor
// into an invalid state where no root element is present.
modelSource
    .setModel({
        type: "graph",
        id: "root",
        children: [],
    })
    .then(() =>
        dispatcher.dispatchAll([
            // Show the default uis after startup
            ...defaultUIElements.map((uiElement) => {
                return SetUIExtensionVisibilityAction.create({
                    extensionId: uiElement.id(),
                    visible: true,
                });
            }),
            // Then load the default diagram and commit the temporary model to the model source
            LoadDefaultDiagramAction.create(),
            CommitModelAction.create(),
        ]),
    )
    .then(() => {
        // Focus the sprotty svg container to enable keyboard shortcuts
        // because those only work if the svg container is focused.
        // Allows to e.g. use the file open shortcut without having to click
        // on the sprotty svg container first.
        const sprottySvgContainer = document.getElementById("sprotty_root");
        sprottySvgContainer?.focus();
    })
    .catch((error) => {
        console.error("Failed to show default UIs and load default diagram", error);
    });

    function createFileFromJson(data: string): File {
        //const jsonString = JSON.stringify(data, null, 2); // Pretty-print JSON
        const jsonBuffer = Buffer.from(data); // Convert JSON string to a Buffer

        // Create a Blob object which is equivalent to a File object in the browser
        const fileBlob = new Blob([jsonBuffer], { type: 'application/json' });

        const file = new File([fileBlob], "example.json", { type: fileBlob.type });
        return file;
}

export const ws = new WebSocket('ws://localhost:3000/events/');  // Change to the dynamic WebSocket port

ws.onmessage = (event) => {
    console.log(event.data);
    if (event.data === "Error:Cycle") {
        alert("Error analyzing model: Model terminates in cycle!");
        return;
    }
    setModelSource(new File([new Blob([event.data], { type: 'application/json' })], "example.json", { type: 'application/json' }));
};





export function setModelSource(file: File): void {
    modelSource
        .setModel({
            type: "graph",
            id: "root",
            children: [],
        })
        .then(() =>
            dispatcher.dispatchAll([
                // Show the default uis after startup
                ...defaultUIElements.map((uiElement) => {
                    return SetUIExtensionVisibilityAction.create({
                        extensionId: uiElement.id(),
                        visible: true,
                    });
                }),
                // Then load the default diagram and commit the temporary model to the model source
                LoadDiagramAction.create(file),
                CommitModelAction.create(),
            ]),
        )
        .then(() => {
            // Focus the sprotty svg container to enable keyboard shortcuts
            // because those only work if the svg container is focused.
            // Allows to e.g. use the file open shortcut without having to click
            // on the sprotty svg container first.
            const sprottySvgContainer = document.getElementById("sprotty_root");
            sprottySvgContainer?.focus();
        })
        .catch((error) => {
            console.error("Failed to show default UIs and load default diagram", error);
        });
}

   
