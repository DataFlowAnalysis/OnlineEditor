import { inject } from "inversify";
import { IStartUpAgent } from "./StartUpAgent";
import { LocalModelSource, TYPES } from "sprotty";

export class SprottyInitializerStartUpAgent implements IStartUpAgent {
    constructor(@inject(TYPES.ModelSource) private modelSource: LocalModelSource) {}

    run() {
        this.modelSource.setModel({
            type: "graph",
            id: "root",
            children: [],
        });
    }
}
