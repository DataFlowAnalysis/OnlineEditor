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
