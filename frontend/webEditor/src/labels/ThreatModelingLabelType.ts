import { LabelType, LabelTypeValue } from "./LabelType.ts";

export interface ThreatModelingLabelType extends LabelType {
    intendedFor: 'Vertex' | 'Flow' //TODO maybe stattdessen hier 'Node' und 'Edge' verwenden
}

export interface ThreatModelingLabelTypeValue extends LabelTypeValue {
    defaultPinBehavior: string,
    additionalInformation: string[]
}

export function isThreatModelingLabelType(labelType: LabelType): labelType is ThreatModelingLabelType {
    return "intendedFor" in labelType;
}

export function isThreatModelingLabelTypeValue(labelTypeValue: LabelTypeValue): labelTypeValue is ThreatModelingLabelTypeValue {
    return "defaultPinBehavior" in labelTypeValue
        && "additionalInformation" in labelTypeValue
}