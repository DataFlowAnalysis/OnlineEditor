import { SModelElementImpl } from "sprotty";
import { LabelAssignment } from "./LabelType";
import { DfdNodeLabelSizeCalculator } from "../diagram/nodes/DfdNodeLabels";

export const containsDfdLabelFeature = Symbol("dfd-label-feature");

export interface ContainsDfdLabels extends SModelElementImpl {
    labels: LabelAssignment[];
    dfdNodeLabelRenderer?: DfdNodeLabelSizeCalculator;
}

export function containsDfdLabels<T extends SModelElementImpl>(element: T): element is T & ContainsDfdLabels {
    return element.features?.has(containsDfdLabelFeature) ?? false;
}
