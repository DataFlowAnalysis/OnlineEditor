import {
    CommitModelAction,
    KeyListener,
    SChildElementImpl,
    SModelElementImpl,
    SModelRootImpl,
    SNodeImpl,
    isSelected,
} from "sprotty";
import { Action, CreateElementAction } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { generateRandomSprottyId } from "../utils";
import { DynamicChildrenProcessor } from "../features/dfdElements/dynamicChildren";
import { injectable, inject } from "inversify";

@injectable()
export class CopyPaste implements KeyListener {
    private copyElements: SModelElementImpl[] = [];

    constructor(
        @inject(DynamicChildrenProcessor) private readonly dynamicChildrenProcessor: DynamicChildrenProcessor,
    ) {}

    keyUp(_element: SModelElementImpl, _event: KeyboardEvent): Action[] {
        return [];
    }

    keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyC", "ctrl")) {
            return this.copy(element.root);
        } else if (matchesKeystroke(event, "KeyV", "ctrl")) {
            return this.paste(element.root);
        }

        return [];
    }

    private copy(root: SModelRootImpl): Action[] {
        this.copyElements = [];

        root.index
            .all()
            .filter((element) => isSelected(element))
            .filter((element) => element instanceof SNodeImpl) // only copy nodes for now
            .forEach((e) => this.copyElements.push(e));

        return [];
    }

    private paste(root: SModelRootImpl): Action[] {
        this.copyElements.forEach((element) => {
            element.id = generateRandomSprottyId();
            // Regenerate the dynamic children with new ids, etc.
            this.dynamicChildrenProcessor.processGraphChildren(element, "set");
        });

        this.copyElements.forEach((element) => {
            root.add(element as SChildElementImpl);
        });

        return [CommitModelAction.create()];
    }
}
