import { injectable, ContainerModule } from "inversify";
import {
    ICommandPaletteActionProvider,
    RequestExportSvgAction,
    LabeledAction,
    SModelRoot,
    TYPES,
    commandPaletteModule,
    EnableToolsAction,
} from "sprotty";
import { FitToScreenAction, Point } from "sprotty-protocol";
import { LogHelloAction } from "../commands/log-hello";
import { EdgeCreationTool } from "./edgeCreationTool";

import "@vscode/codicons/dist/codicon.css";
import "sprotty/css/command-palette.css";
import "./commandPalette.css";
import { SaveDiagramAction } from "../commands/save";
import { LoadDiagramAction } from "../commands/load";

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
            { padding: 40 },
        );

        return [
            new LabeledAction("Create new edge", [EnableToolsAction.create([EdgeCreationTool.ID])], "link"),
            new LabeledAction("Fit to Screen", [fitToScreenAction], "layout"),
            new LabeledAction("Save diagram as JSON", [SaveDiagramAction.create("diagram.json")], "save"),
            new LabeledAction("Load diagram from JSON", [LoadDiagramAction.create()], "go-to-file"),
            new LabeledAction("Export as SVG", [RequestExportSvgAction.create()], "export"),
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
