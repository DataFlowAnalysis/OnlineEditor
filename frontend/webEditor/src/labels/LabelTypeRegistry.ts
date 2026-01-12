import { generateRandomSprottyId } from "../utils/idGenerator";
import { LabelAssignment, LabelType, LabelTypeValue } from "./LabelType";

export class LabelTypeRegistry {
    private labelTypes: LabelType[] = [];
    private updateCallbacks: (() => void)[] = [];

    public registerLabelType(name: string): LabelType {
        const labelType: LabelType = {
            id: generateRandomSprottyId(),
            name,
            values: [],
        };
        this.labelTypes.push(labelType);
        this._registerLabelTypeValue(labelType.id, "Value", true);
        this.labelTypeChanged();
        return labelType;
    }

    public unregisterLabelType(id: string): void {
        this.labelTypes = this.labelTypes.filter((type) => type.id !== id);
        this.labelTypeChanged();
    }

    public updateLabelTypeName(id: string, name: string): void {
        const labelType = this.labelTypes.find((l) => l.id === id);
        if (!labelType) {
            throw `No Label Type with id ${id} found`;
        }
        labelType.name = name;
        this.labelTypeChanged();
    }

    public setLabelTypes(labelTypes: LabelType[]) {
        this.labelTypes = labelTypes;
        this.labelTypeChanged();
    }

    public registerLabelTypeValue(labelTypeId: string, text: string): LabelTypeValue {
        return this._registerLabelTypeValue(labelTypeId, text);
    }

    private _registerLabelTypeValue(labelTypeId: string, text: string, surpressUpdate = false): LabelTypeValue {
        const labelTypeValue: LabelTypeValue = {
            id: generateRandomSprottyId(),
            text,
        };
        const labelType = this.labelTypes.find((type) => type.id === labelTypeId);
        if (!labelType) {
            throw `No Label Type with id ${labelTypeId} found`;
        }
        labelType.values.push(labelTypeValue);
        if (!surpressUpdate) {
            this.labelTypeChanged();
        }
        return labelTypeValue;
    }

    public unregisterLabelTypeValue(labelTypeId: string, labelTypeValueId: string): void {
        const labelType = this.labelTypes.find((type) => type.id === labelTypeId);
        if (!labelType) {
            throw `No Label Type with id ${labelTypeId} found`;
        }
        labelType.values = labelType.values.filter((value) => value.id !== labelTypeValueId);
        this.labelTypeChanged();
    }

    public updateLabelTypeValueText(labelTypeId: string, labelTypeValueId: string, text: string) {
        const labelType = this.labelTypes.find((type) => type.id === labelTypeId);
        if (!labelType) {
            throw `No Label Type with id ${labelTypeId} found`;
        }
        const value = labelType.values.find((l) => l.id === labelTypeValueId);
        if (!value) {
            throw `Label Type ${labelType.name} has no value with id ${labelTypeValueId}`;
        }
        value.text = text;
        this.labelTypeChanged();
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

    /**
     * Resolves a `LabelAssignment` and returns the matching `LabelType` and `LabelTypeValue`.
     * If the `LabelAssignment` cannot be resolved, returns `{}`.
     * @param labelAssignment The IDs of the `LabelType` and `LabelTypeValue`. to resolve.
     */
    public getLabelAssignment(labelAssignment: LabelAssignment): Partial<{ labelType: LabelType, labelTypeValue: LabelTypeValue }>
    {
        const labelType = this.getLabelType(labelAssignment.labelTypeId);
        const labelTypeValue = labelType?.values
            .find((value) => value.id === labelAssignment.labelTypeValueId);

        if (!labelType || !labelTypeValue) return {};

        return {labelType, labelTypeValue};
    }
}
