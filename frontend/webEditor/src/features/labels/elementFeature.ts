import { SChildElementImpl, SModelElementImpl, SParentElementImpl, SShapeElementImpl } from "sprotty";
import { LabelAssignment } from "./labelTypeRegistry";

export const containsDfdLabelFeature = Symbol("dfd-label-feature");

export interface ContainsDfdLabels extends SModelElementImpl {
    labels: LabelAssignment[];
}

export function containsDfdLabels<T extends SModelElementImpl>(element: T): element is T & ContainsDfdLabels {
    return element.features?.has(containsDfdLabelFeature) ?? false;
}

// Traverses the graph upwards to find any element having the dfd label feature.
// This is needed because you may select/drop onto a child element of the node implementing and displaying dfd labels.
// If the element itself and no parent has the feature undefined is returned.
export function getParentWithDfdLabels(
    element: SChildElementImpl | SParentElementImpl | SShapeElementImpl,
): (SModelElementImpl & ContainsDfdLabels) | undefined {
    if (containsDfdLabels(element)) {
        return element;
    }

    if ("parent" in element) {
        return getParentWithDfdLabels(element.parent);
    }

    return undefined;
}
