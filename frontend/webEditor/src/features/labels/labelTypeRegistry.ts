export interface LabelType {
    id: string;
    name: string;
    values: LabelTypeValue[];
}

export interface LabelTypeValue {
    id: string;
    text: string;
}

export interface LabelAssignment {
    labelTypeId: string;
    labelTypeValueId: string;
}

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

    public getLabelType(id: string): LabelType | undefined {
        return this.labelTypes.find((type) => type.id === id);
    }
}

// Usually we would add the registry to a inversify container module and inject it using dependency injection where needed.
// Sadly some places where the registry is used are not inside a inversify container.
// An example for this are the node implementation classes that need the registry to compute the bounds of the node.
// These classes are not managed by inversify and therefore we cannot inject the registry there.
// To solve this we export this registry instance as a global variable for these situations.
// For all other situations where inversify can be used this exact same instance is available to be injected as well.
export const globalLabelTypeRegistry = new LabelTypeRegistry();
