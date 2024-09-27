import { ContainerModule } from "inversify";
import {
    EditLabelAction,
    EditLabelActionHandler,
    EditLabelUI,
    SModelRootImpl,
    TYPES,
    configureActionHandler,
} from "sprotty";

// For our use-case the sprotty container is at (0, 0) and fills the whole screen.
// Scrolling is disabled using CSS which disallows scrolling from the user.
// However the page might still be scrolled due to focus events.
// This is the case for the default sprotty EditLabelUI.
// When editing a label at a position where the edit control
// of the UI would be outside the viewport (at the right or bottom)
// the page would scroll to the right/bottom due to the focus event.
// To circumvent this we inherit from the default EditLabelUI and change it to
// scroll the page back to the page origin at (0, 0) if it has been moved due to the
// focus event.

class NoScrollEditLabelUI extends EditLabelUI {
    protected override onBeforeShow(
        containerElement: HTMLElement,
        root: Readonly<SModelRootImpl>,
        ...contextElementIds: string[]
    ): void {
        super.onBeforeShow(containerElement, root, ...contextElementIds);

        // Scroll page to 0,0 if not already there
        if (window.scrollX !== 0 || window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }
    }
}

export const noScrollLabelEditUiModule = new ContainerModule((bind, _unbind, isBound) => {
    // Provide the same stuff as the labelEditUiModule from sprotty but use our own EditLabelUI
    // instead of the default one.
    // When using this module the original sprotty labelEditUiModule must not be loaded aswell.
    const context = { bind, isBound };
    configureActionHandler(context, EditLabelAction.KIND, EditLabelActionHandler);
    bind(NoScrollEditLabelUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(NoScrollEditLabelUI);
});
