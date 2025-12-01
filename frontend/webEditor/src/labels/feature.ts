import { SModelElementImpl } from "sprotty";
import { LabelAssignment } from "./LabelType";

export const containsDfdLabelFeature = Symbol("dfd-label-feature");

export interface ContainsDfdLabels extends SModelElementImpl {
    labels: LabelAssignment[];
}

export function containsDfdLabels<T extends SModelElementImpl>(element: T): element is T & ContainsDfdLabels {
    return element.features?.has(containsDfdLabelFeature) ?? false;
}