import { injectable, inject, postConstruct, ContainerModule } from "inversify";
import {
    CommandPalette,
    CommandPaletteActionProviderRegistry,
    CommandPaletteKeyListener,
    ICommandPaletteActionProvider,
    KeyListener,
    KeyTool,
    LabeledAction,
    SModelRoot,
    TYPES,
    Tool,
} from "sprotty";
import { FitToScreenAction, Point } from "sprotty-protocol";

import "@vscode/codicons/dist/codicon.css";
import "./commandPalette.css";
import { EDITOR_TYPES } from "../utils";
import { LogHelloAction } from "../commands/log-hello";

@injectable()
export class ServerCommandPaletteActionProvider implements ICommandPaletteActionProvider {
    async getActions(
        root: Readonly<SModelRoot>,
        _text: string,
        _lastMousePosition?: Point,
        _index?: number,
    ): Promise<LabeledAction[]> {
        const fitToScreenAction = FitToScreenAction.create(
            root.children.map((child) => child.id),
            { padding: 40 },
        );
        return [
            new LabeledAction("Fit to Screen", [fitToScreenAction], "layout"),
            new LabeledAction("hello world", [LogHelloAction.create("from command palette hello")], "symbol-event"),
            new LabeledAction("test", [LogHelloAction.create("from command palette test")], "zoom-in"),
            new LabeledAction(
                "lorem ipsum",
                [LogHelloAction.create("from command palette lorem ipsum")],
                "type-hierarchy-sub",
            ),
        ];
    }
}

@injectable()
export class CommandPaletteTool implements Tool {
    static ID = "command-palette-tool";

    protected commandPaletteKeyListener: KeyListener = new KeyListener();
    @inject(KeyTool) protected keyTool: KeyTool = new KeyTool();

    @postConstruct()
    protected postConstruct(): void {
        this.commandPaletteKeyListener = this.createCommandPaletteKeyListener();
    }

    get id(): string {
        return CommandPaletteTool.ID;
    }

    enable(): void {
        this.keyTool.register(this.commandPaletteKeyListener);
    }

    disable(): void {
        this.keyTool.deregister(this.commandPaletteKeyListener);
    }

    protected createCommandPaletteKeyListener(): KeyListener {
        return new CommandPaletteKeyListener();
    }
}

export const customCommandPaletteModule = new ContainerModule((bind) => {
    bind(TYPES.ICommandPaletteActionProviderRegistry).to(CommandPaletteActionProviderRegistry).inSingletonScope();
    bind(CommandPalette).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(CommandPalette);
    bind(ServerCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(ServerCommandPaletteActionProvider);
    bind(CommandPaletteTool).toSelf().inSingletonScope();
    bind(EDITOR_TYPES.IDefaultTool).toService(CommandPaletteTool);
});
