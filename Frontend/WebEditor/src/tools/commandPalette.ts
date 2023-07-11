import { injectable, ContainerModule } from "inversify";
import {
    ICommandPaletteActionProvider,
    RequestExportSvgAction,
    LabeledAction,
    SModelRoot,
    TYPES,
    commandPaletteModule,
    EnableToolsAction,
    CommitModelAction,
} from "sprotty";
import { FitToScreenAction, Point } from "sprotty-protocol";
import { LogHelloAction } from "../commands/log-hello";
import { EdgeCreationTool } from "./edgeCreationTool";
import { SaveDiagramAction } from "../commands/save";
import { LoadDiagramAction } from "../commands/load";
import { LoadDefaultDiagramAction } from "../commands/loadDefaultDiagram";
import { FIT_TO_SCREEN_PADDING } from "../utils";

import "@vscode/codicons/dist/codicon.css";
import "sprotty/css/command-palette.css";
import "./commandPalette.css";

/**
 * Provides possible actions for the command palette.
 */
@injectable()
export class ServerCommandPaletteActionProvider implements ICommandPaletteActionProvider {
    async getActions(
        root: Readonly<SModelRoot>,
        _text: string,
        _lastMousePosition?: Point,
        _index?: number,
    ): Promise<LabeledAction[]> {
        const fitToScreenAction = FitToScreenAction.create(
            root.children.map((child) => child.id), // Fit screen to all children
            { padding: FIT_TO_SCREEN_PADDING },
        );
        const commitAction = CommitModelAction.create();

        return [
            new LabeledAction("Fit to Screen", [fitToScreenAction], "layout"),
            new LabeledAction("Create new edge", [EnableToolsAction.create([EdgeCreationTool.ID])], "link"),
            new LabeledAction("Save diagram as JSON", [SaveDiagramAction.create("diagram.json")], "save"),
            new LabeledAction("Load diagram from JSON", [LoadDiagramAction.create(), commitAction], "go-to-file"),
            new LabeledAction("Export as SVG", [RequestExportSvgAction.create()], "export"),
            new LabeledAction("Load default diagram", [LoadDefaultDiagramAction.create(), commitAction], "clear-all"),
            // TODO: this action is only used for demonstration purposes including the LogHelloAction. This should be removed
            new LabeledAction("Log Hello World", [LogHelloAction.create("from command palette hello")], "symbol-event"),
        ];
    }
}

const commandPaletteActionProviderModule = new ContainerModule((bind) => {
    bind(ServerCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(ServerCommandPaletteActionProvider);
});

export const commandPaletteModules = [commandPaletteModule, commandPaletteActionProviderModule];
