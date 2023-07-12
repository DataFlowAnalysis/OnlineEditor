import { injectable } from "inversify";

export interface LabelType {
    id: string;
    name: string;
    values: LabelTypeValue[];
}

export interface LabelTypeValue {
    id: string;
    value: string;
}

@injectable()
export class LabelTypeRegistry {
    private labelTypes: LabelType[] = [];
    private updateCallbacks: (() => void)[] = [];

    public registerLabelType(labelType: LabelType): void {
        this.labelTypes.push(labelType);
        this.updateCallbacks.forEach((cb) => cb());
    }

    public unregisterLabelType(labelType: LabelType): void {
        this.labelTypes = this.labelTypes.filter((type) => type.id !== labelType.id);
        this.updateCallbacks.forEach((cb) => cb());
    }

    public clearLabelTypes(): void {
        this.labelTypes = [];
        this.updateCallbacks.forEach((cb) => cb());
    }

    public labelTypeChanged(): void {
        this.updateCallbacks.forEach((cb) => cb());
    }

    public onUpdate(callback: () => void): void {
        this.updateCallbacks.push(callback);
    }

    public getLabelTypes(): LabelType[] {
        return this.labelTypes;
    }
}
