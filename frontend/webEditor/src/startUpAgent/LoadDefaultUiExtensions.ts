import { inject, injectable, multiInject } from "inversify";
import { EDITOR_TYPES } from "../editorTypes";
import { AbstractUIExtension, ActionDispatcher, SetUIExtensionVisibilityAction, TYPES } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";
import { URLParameters } from "../urlParameters/URLParameters";

@injectable()
export class LoadDefaultUiExtensionsStartUpAgent implements IStartUpAgent {
    constructor(
        @inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher,
        @multiInject(EDITOR_TYPES.DefaultUIElement) private defaultUiElements: AbstractUIExtension[],
        @inject(URLParameters) private urlParameters: URLParameters,
    ) {}

    public run() {
        const embedMode = this.urlParameters.getBoolean("embed");
        const uiVisibilityActions = this.defaultUiElements.map((e) =>
            SetUIExtensionVisibilityAction.create({ extensionId: e.id(), visible: !embedMode }),
        );
        this.actionDispatcher.dispatchAll(uiVisibilityActions);
    }
}
