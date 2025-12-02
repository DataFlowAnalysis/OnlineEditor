import { injectable } from "inversify";

@injectable()
export class TFGManager {
    private selectedTfgs = new Set<number>();

    public getSelectedTfgs(): Set<number> {
        return this.selectedTfgs;
    }
    public clearTfgs() {
        this.selectedTfgs = new Set<number>();
    }
    public addTfg(hash: number) {
        this.selectedTfgs.add(hash);
    }

    constructor() {}
}
