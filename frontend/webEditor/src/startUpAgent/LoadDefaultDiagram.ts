import { ActionDispatcher, TYPES } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";
import { LoadDefaultDiagramAction } from "../serialize/loadDefaultDiagram";
import { inject } from "inversify";
import { LoadFromUrlAction } from "../serialize/LoadUrl";
import { LayoutModelAction } from "../layout/command";
import { LayoutMethod } from "../layout/layoutMethod";

export class LoadDefaultDiagramStartUpAgent implements IStartUpAgent {
    constructor(@inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher) {}

    run(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const fileUrlParameter = urlParams.get("file");
        const doLayout = urlParams.get("layout") === "true";
        const actions = [
            fileUrlParameter != undefined
                ? LoadFromUrlAction.create(fileUrlParameter)
                : LoadDefaultDiagramAction.create(),
        ];
        if (doLayout) {
            actions.push(LayoutModelAction.create(LayoutMethod.LINES));
        }
        this.actionDispatcher.dispatchAll(actions);
    }
}
