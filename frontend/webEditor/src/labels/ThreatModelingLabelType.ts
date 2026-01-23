import { LabelAssignment, LabelType, LabelTypeValue } from "./LabelType.ts";

export interface ThreatModelingLabelType extends LabelType {
    intendedFor: 'Vertex' | 'Flow' //TODO maybe stattdessen hier 'Node' und 'Edge' verwenden
}

export interface ThreatModelingLabelTypeValue extends LabelTypeValue {
    excludes: LabelAssignment[]
    additionalInformation?: string
}

export function isThreatModelingLabelType(labelType: LabelType): labelType is ThreatModelingLabelType {
    return "intendedFor" in labelType;
}

export function isThreatModelingLabelTypeValue(labelTypeValue: LabelTypeValue): labelTypeValue is ThreatModelingLabelTypeValue {
    return "excludes" in labelTypeValue
}