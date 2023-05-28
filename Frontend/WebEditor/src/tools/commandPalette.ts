import { injectable, ContainerModule } from "inversify";
import {
    ICommandPaletteActionProvider,
    RequestExportSvgAction,
    LabeledAction,
    SModelRoot,
    TYPES,
    commandPaletteModule,
} from "sprotty";
import { FitToScreenAction, Point } from "sprotty-protocol";
import { LogHelloAction } from "../commands/log-hello";

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
            { padding: 40 },
        );

        return [
            new LabeledAction("Fit to Screen", [fitToScreenAction], "layout"),
            new LabeledAction("Export as SVG", [RequestExportSvgAction.create()], "export"),
            new LabeledAction("Log Hello World", [LogHelloAction.create("from command palette hello")], "symbol-event"),
            new LabeledAction("Log Test", [LogHelloAction.create("from command palette test")], "zoom-in"),
            new LabeledAction(
                "Log lorem ipsum",
                [LogHelloAction.create("from command palette lorem ipsum")],
                "type-hierarchy-sub",
            ),
        ];
    }
}

const commandPaletteActionProviderModule = new ContainerModule((bind) => {
    bind(ServerCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(ServerCommandPaletteActionProvider);
});

export const commandPaletteModules = [commandPaletteModule, commandPaletteActionProviderModule];
