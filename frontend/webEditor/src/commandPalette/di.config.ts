import { ContainerModule } from "inversify";
import { CommandPalette, TYPES } from "sprotty";
import { WebEditorCommandPaletteActionProvider } from "./commandPaletteProvider";
import { WebEditorCommandPalette } from "./commandPalette";

export const commandPaletteModule = new ContainerModule((bind, _, __, rebind) => {
    rebind(CommandPalette).to(WebEditorCommandPalette).inSingletonScope();

    bind(WebEditorCommandPaletteActionProvider).toSelf().inSingletonScope();
    bind(TYPES.ICommandPaletteActionProvider).toService(WebEditorCommandPaletteActionProvider);
});
