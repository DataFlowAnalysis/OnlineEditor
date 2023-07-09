import { injectable } from "inversify";

export interface LabelType {
    id: string;
    name: string;
    values: string[];
}

@injectable()
export class LabelTypeRegistry {
    private labelTypes: LabelType[] = [];

    public registerLabelType(labelType: LabelType) {
        this.labelTypes.push(labelType);
    }

    public unregisterLabelType(labelType: LabelType) {
        this.labelTypes = this.labelTypes.filter((type) => type.id !== labelType.id);
    }

    public getLabelTypes() {
        return this.labelTypes;
    }
}
