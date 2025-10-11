import { inject } from "inversify";
import { IStartUpAgent } from "./StartUpAgent";
import { LocalModelSource, TYPES } from "sprotty";

export class SprottyInitializerStartUpAgents implements IStartUpAgent {
    constructor(@inject(TYPES.ModelSource) private modelSource: LocalModelSource) {}

    run() {
        this.modelSource.setModel({
            type: "graph",
            id: "root",
            children: [],
        });
    }
}
