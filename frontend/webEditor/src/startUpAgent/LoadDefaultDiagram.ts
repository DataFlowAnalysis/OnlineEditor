import { ActionDispatcher, TYPES } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";
import { LoadDefaultDiagramAction } from "../serialize/loadDefaultDiagram";
import { inject } from "inversify";
import { LoadFromUrlAction } from "../serialize/LoadUrl";
import { LayoutModelAction } from "../layout/command";
import { LayoutMethod } from "../layout/layoutMethod";
import { URLParameters } from "../urlParameters/URLParameters";

export class LoadDefaultDiagramStartUpAgent implements IStartUpAgent {
    constructor(
        @inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher,
        @inject(URLParameters) private urlParameters: URLParameters,
    ) {}

    run(): void {
        const fileUrlParameter = this.urlParameters.get("file");
        const doLayout = this.urlParameters.getBoolean("layout");
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
