import { inject, injectable, multiInject } from "inversify";
import { EDITOR_TYPES } from "../editorTypes";
import { AbstractUIExtension, ActionDispatcher, SetUIExtensionVisibilityAction, TYPES } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";

@injectable()
export class LoadDefaultUiExtensionsStartUpAgent implements IStartUpAgent {
    constructor(
        @inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher,
        @multiInject(EDITOR_TYPES.DefaultUIElement) private defaultUiElements: AbstractUIExtension[],
    ) {}

    public run() {
        const urlParams = new URLSearchParams(window.location.search);
        const embedMode = urlParams.get("embed") === "true";
        const uiVisibilityActions = this.defaultUiElements.map((e) =>
            SetUIExtensionVisibilityAction.create({ extensionId: e.id(), visible: !embedMode }),
        );
        this.actionDispatcher.dispatchAll(uiVisibilityActions);
    }
}
