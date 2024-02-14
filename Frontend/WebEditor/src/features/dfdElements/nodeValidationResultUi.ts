import { inject, injectable } from "inversify";
import {
    AbstractUIExtension,
    IActionDispatcher,
    MouseListener,
    SChildElementImpl,
    SModelElementImpl,
    SModelRootImpl,
    SetUIExtensionVisibilityAction,
    TYPES,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { DfdNodeImpl } from "./nodes";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./nodeValidationResultUi.css";

export class DfdNodeValidationResultUIMouseListener extends MouseListener {
    private stillTimeout: NodeJS.Timeout | undefined;
    private lastPosition = { x: 0, y: 0 };

    constructor(@inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher) {
        super();
    }

    mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        const dfdNode = this.findDfdNode(target);
        if (!dfdNode) {
            if (this.stillTimeout) {
                clearTimeout(this.stillTimeout);
                this.stillTimeout = undefined;
            }
            return [];
        }

        if (this.lastPosition.x !== event.clientX || this.lastPosition.y !== event.clientY) {
            this.lastPosition = { x: event.clientX, y: event.clientY };
            // Mouse has moved, so we reset the timeout
            if (this.stillTimeout) {
                clearTimeout(this.stillTimeout);
            }
            this.stillTimeout = setTimeout(() => {
                // When the mouse has not moved for 500ms, we show the popup
                this.stillTimeout = undefined;

                if (dfdNode.opacity !== 1) {
                    // Only show when opacity is 1.
                    // The opacity is not 1 when the node is currently being created but has not been
                    // placed yet.
                    // In this case we don't want to show the popup
                    // and interfere with the creation process.
                    return;
                }

                this.showPopup(dfdNode);
            }, 500);
        }

        return [];
    }

    private findDfdNode(currentNode: SModelElementImpl): DfdNodeImpl | undefined {
        if (currentNode instanceof DfdNodeImpl) {
            return currentNode;
        } else if (currentNode instanceof SChildElementImpl && currentNode.parent) {
            return this.findDfdNode(currentNode.parent);
        } else {
            return undefined;
        }
    }

    private showPopup(target: DfdNodeImpl): void {
        if (!target.validationResult) {
            // no validation errors, all fine. No need to show the popup.
            return;
        }

        this.actionDispatcher.dispatch(
            SetUIExtensionVisibilityAction.create({
                extensionId: DfdNodeValidationResultUI.ID,
                visible: true,
                contextElementsId: [target.id],
            }),
        );
    }

    public getMousePosition(): { x: number; y: number } {
        return this.lastPosition;
    }
}

@injectable()
export class DfdNodeValidationResultUI extends AbstractUIExtension {
    static readonly ID = "dfd-node-validation-result-ui";

    private readonly validationParagraph = document.createElement("p") as HTMLParagraphElement;

    constructor(
        @inject(DfdNodeValidationResultUIMouseListener)
        private readonly mouseListener: DfdNodeValidationResultUIMouseListener,
    ) {
        super();
    }

    id(): string {
        return DfdNodeValidationResultUI.ID;
    }

    containerClass(): string {
        return this.id();
    }

    protected override initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");
        containerElement.appendChild(this.validationParagraph);

        containerElement.addEventListener("mouseleave", () => {
            this.hide();
        });
    }

    protected override onBeforeShow(
        containerElement: HTMLElement,
        root: Readonly<SModelRootImpl>,
        ...contextElementIds: string[]
    ): void {
        if (contextElementIds.length !== 1) {
            this.validationParagraph.innerText =
                "UI Error: Expected exactly one context element id, but got " + contextElementIds.length;
            return;
        }

        const node = root.index.getById(contextElementIds[0]);
        if (!(node instanceof DfdNodeImpl)) {
            this.validationParagraph.innerText =
                "UI Error: Expected context element to be a DfdNodeImpl, but got " + node;
            return;
        }

        // Clear previous content
        this.validationParagraph.innerHTML = "";

        // 2 offset to ensure the mouse is inside the popup when showing it.
        // Otherwise it would be on the node instead of the popup because of the rounded corners.
        // The cursor should be inside the popup when opening it for the closing
        // using the mouseleave event to work correctly.
        const mousePosition = this.mouseListener.getMousePosition();
        containerElement.style.left = `${mousePosition.x - 2}px`;
        containerElement.style.top = `${mousePosition.y - 2}px`;

        if (!node.validationResult) {
            this.validationParagraph.innerText = "No errors";
            return;
        }

        const { message, fontAwesomeIcon } = node.validationResult;
        this.validationParagraph.innerText = message;

        if (fontAwesomeIcon) {
            const icon = document.createElement("i");
            icon.classList.add("fa", `fa-${fontAwesomeIcon}`);
            this.validationParagraph.prepend(icon);
        }
    }
}
