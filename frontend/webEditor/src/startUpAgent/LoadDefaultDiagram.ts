import { ActionDispatcher, TYPES } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";
import { LoadDefaultDiagramAction } from "../serialize/loadDefaultDiagram";
import { inject } from "inversify";
import { LoadFromUrlAction } from "../serialize/LoadUrl";

export class LoadDefaultDiagramStartUpAgent implements IStartUpAgent {
    constructor(@inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher) {}

    run(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const fileUrlParameter = urlParams.get("file");
        this.actionDispatcher.dispatch(
            fileUrlParameter != undefined
                ? LoadFromUrlAction.create(fileUrlParameter)
                : LoadDefaultDiagramAction.create(),
        );
    }
}
