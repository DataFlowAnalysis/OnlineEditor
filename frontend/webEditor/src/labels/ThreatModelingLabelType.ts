import { LabelType, LabelTypeValue } from "./LabelType.ts";

export interface ThreatModelingLabelType extends LabelType {
    intendedFor: 'Vertex' | 'Flow' //TODO maybe stattdessen hier 'Node' und 'Edge' verwenden
}

export interface ThreatModelingLabelTypeValue extends LabelTypeValue {
    defaultPinBehavior: string,
    additionalInformation: string[]
}