import { AbstractUIExtension, SModelRootImpl } from "sprotty";
import './dialog.css'
import { injectable } from "inversify";

/**
 * Base class for a dialog. The generic type parameter `T` is used to specify the possible return values.
 *
 * The return value of the dialog (i.e. which button has been pressed) is then-able by calling `getResult()`.
 * Do NOT await the result inside a Command, since Sprotty executes only one command at a time.
 */
@injectable()
export abstract class AbstractDialog extends AbstractUIExtension {

    public constructor() {
        super();
    }

    containerClass(): string {
        return "dialog-container";
    }

    override hide() {
        super.hide();
        this.containerElement.classList.add("hidden");
    }

    override show(root: Readonly<SModelRootImpl>, ...contextElementIds: string[]): void {
        super.show(root, ...contextElementIds)
        this.containerElement.classList.remove("hidden");
    }

    protected initializeContents(containerElement: HTMLElement): void {
        const dialog = document.createElement("div");
        dialog.classList.add("dialog");
        containerElement.appendChild(dialog);

        dialog.appendChild(this.initializeText());

        const actions = this.initializeButtons()
        actions.forEach(button => {
            button.addEventListener("click", () => {
                this.hide();
            })
            dialog.appendChild(button)
        })
    }

    protected abstract initializeText(): HTMLElement;
    protected abstract initializeButtons(): HTMLButtonElement[];
}