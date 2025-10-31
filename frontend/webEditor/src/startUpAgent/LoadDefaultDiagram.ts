import { ActionDispatcher, TYPES } from "sprotty";
import { IStartUpAgent } from "./StartUpAgent";
import { LoadDefaultDiagramAction } from "../serialize/loadDefaultDiagram";
import { inject } from "inversify";

export class LoadDefaultDiagramStartUpAgent implements IStartUpAgent {
    constructor(@inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher) {}

    run(): void {
        this.actionDispatcher.dispatch(LoadDefaultDiagramAction.create())
    }

}