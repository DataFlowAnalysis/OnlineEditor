import {
    BringToFrontCommand,
    CenterCommand,
    CommandStack,
    FitToScreenCommand,
    HiddenCommand,
    ICommand,
    SelectCommand,
    SetViewportCommand,
} from "sprotty";

/**
 * Custom command stack implementations that only pushes
 * commands that modify the diagram to the undo stack.
 * Commands like selections, viewport moves etc. are filtered out
 * and not pushed to the undo stack. Because of this they will not
 * be undone when the user presses Ctrl+Z.
 *
 * This is done because the commands like selections clutter up
 * the stack and the user has to undo many commands without
 * really knowing what they are undoing when the selections/viewport moves
 * are small.
 */
export class DiagramModificationCommandStack extends CommandStack {
    protected override isPushToUndoStack(command: ICommand): boolean {
        return !(
            command instanceof HiddenCommand ||
            command instanceof SelectCommand ||
            command instanceof SetViewportCommand ||
            command instanceof BringToFrontCommand ||
            command instanceof FitToScreenCommand ||
            command instanceof CenterCommand
        );
    }
}
