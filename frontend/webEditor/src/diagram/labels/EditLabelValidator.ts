import { injectable } from "inversify";
import {
    IEditLabelValidator,
    EditableLabel,
    SModelElementImpl,
    EditLabelValidationResult,
    SChildElementImpl,
    SEdgeImpl,
} from "sprotty";
import { DfdNodeImpl } from "../nodes/common";
import { DfdInputPortImpl } from "../ports/DfdInputPort";

/**
 * Validator for the label of an dfd edge.
 * Ensures that the label of an dfd edge is unique within the node that the edge is connected to.
 * Does not do any validation if the label is not a child of an dfd edge.
 */
@injectable()
export class DfdEditLabelValidator implements IEditLabelValidator {
    async validate(value: string, label: EditableLabel & SModelElementImpl): Promise<EditLabelValidationResult> {
        // Check whether we have an dfd edge label and a non-empty label value
        if (!(label instanceof SChildElementImpl)) {
            return { severity: "ok" };
        }

        const labelParent = label.parent;
        if (!(labelParent instanceof SEdgeImpl)) {
            return { severity: "ok" };
        }

        // Labels on edges are not allowed to have spaces in them
        if (value.includes(" ")) {
            return { severity: "error", message: "Input name cannot contain spaces" };
        }

        // Labels on edges are not allowed to commas in them
        if (value.includes(",")) {
            return { severity: "error", message: "Input name cannot contain commas" };
        }

        // Labels on edges are not allowed to be empty
        if (value.length == 0) {
            return { severity: "error", message: "Input name cannot be empty" };
        }

        // Get node and edge names that are in use
        const edge = labelParent;
        const edgeTarget = edge.target;
        if (!(edgeTarget instanceof DfdInputPortImpl)) {
            return { severity: "ok" };
        }

        const inputPort = edgeTarget;
        const node = inputPort.parent as DfdNodeImpl;
        const usedEdgeNames = node.getEdgeTexts((e) => e.id !== edge.id); // filter out the edge we are currently editing

        // Check whether the label value is already used (case insensitive)
        if (usedEdgeNames.find((name) => name.toLowerCase() === value.toLowerCase())) {
            return { severity: "error", message: "Input name already used" };
        }

        return { severity: "ok" };
    }
}
