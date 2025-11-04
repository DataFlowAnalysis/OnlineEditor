import { ContainerModule } from "inversify";
import { CommandPalette, TYPES } from "sprotty";
import { WebEditorCommandPalette } from "./CommandPalette";
import { WebEditorCommandPaletteActionProvider } from "./CommandPaletteProvider";

export const commandPaletteModule = new ContainerModule((bind, _, __, rebind) => {
  rebind(CommandPalette).to(WebEditorCommandPalette).inSingletonScope();

  bind(WebEditorCommandPaletteActionProvider).toSelf().inSingletonScope();
  bind(TYPES.ICommandPaletteActionProvider).toService(WebEditorCommandPaletteActionProvider);
});