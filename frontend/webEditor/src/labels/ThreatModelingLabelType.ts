import { LabelAssignment, LabelType, LabelTypeValue } from "./LabelType.ts";

export interface ThreatModelingLabelType extends LabelType {
    intendedFor: "Vertex" | "Flow";
}

export interface ThreatModelingLabelTypeValue extends LabelTypeValue {
    excludes: LabelAssignment[];
    additionalInformation?: string;
}

export function isThreatModelingLabelType(labelType: LabelType): labelType is ThreatModelingLabelType {
    return "intendedFor" in labelType;
}

export function isThreatModelingLabelTypeValue(
    labelTypeValue: LabelTypeValue,
): labelTypeValue is ThreatModelingLabelTypeValue {
    return "excludes" in labelTypeValue;
}

/**
 * Transforms a `ThreatModelingLabelType` object to an object than can the backend can handle by removing additional
 * attributes.
 * @param labelType The `ThreatModelingLabelType` to transform
 * @param recursive Whether the values of the `LabelType` should also be transformed into `LabelTypeValue` objects that
 * can be sent to the backend
 */
export function threatModelingLabelTypeToBackendPayload(
    labelType: ThreatModelingLabelType,
    recursive: boolean,
): LabelType {
    // 'intendedFor' is removed from the payload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { intendedFor, values, ...defaultAttributes } = labelType;

    let transformedValues = values;
    if (recursive) {
        transformedValues = values.map((value) =>
            isThreatModelingLabelTypeValue(value) ? threatModelingLabelTypeValueToBackendPayload(value) : value,
        );
    }

    return { ...defaultAttributes, values: transformedValues };
}

/**
 * Transforms a `ThreatModelingLabelTypeValue` object to an object than can the backend can handle by removing additional
 * attributes.
 * @param labelTypeValue The `ThreatModelingLabelTypeValue` to transform
 */
function threatModelingLabelTypeValueToBackendPayload(labelTypeValue: ThreatModelingLabelTypeValue): LabelTypeValue {
    // 'excludes' and 'additionalInformation' is removed from the payload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { excludes, additionalInformation, ...defaultAttributes } = labelTypeValue;
    return { ...defaultAttributes };
}
