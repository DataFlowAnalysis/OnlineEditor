import { injectable, multiInject } from "inversify";
import { SModelElementRegistration, SNodeImpl, SEdgeImpl, TYPES } from "sprotty";
import { SModelElement, SEdge, SNode } from "sprotty-protocol";

// This file contains helpers to dynamically specify the children of a sprotty element.
// Element children are generally used for e.g. labels in sprotty or other sub elements.
// You could embed everything into one element but it is often easier to use children.
// E.g. for editable labels you would need to implement a custom label edit ui which is pretty complicated.

// Normally, the children of a sprotty element are specified in the model.
// However this means that the children are saved together with the model.
// Imagine you want to change the children of a node at some point, e.g to add another text label,
// move it slightly or align the text differently.
// When you save the children you would need to migrate the previously saved models
// to the new children.

// This is undesirable as the display of a node should not be hardcoded in the serialized model.
// To circumvent this, these helper classes were developed.
// The model is saved without children and the children are added dynamically by the runtime
// by each model element using the setChildren method.
// This sets the `children` array of the element and also loads data from the parent element into the children
// (e.g. texts for labels).
// When the model is saved, the removeChildren method is called to remove the children again.
// This method also needs to save the data of the children in the parent element, so it is properly saved.
// This ensures that the display of a node is a implementation detail and not encoded in the saved models.

// Abstract classes that define the both abstract methods setChildren and removeChildren

export abstract class DynamicChildrenNode extends SNodeImpl {
    abstract setChildren(schema: SNode): void;
    abstract removeChildren(schema: SNode): void;
}

export abstract class DynamicChildrenEdge extends SEdgeImpl {
    abstract setChildren(schema: SEdge): void;
    abstract removeChildren(schema: SEdge): void;
}

@injectable()
export class DynamicChildrenProcessor {
    @multiInject(TYPES.SModelElementRegistration)
    private readonly elementRegistrations: SModelElementRegistration[] = [];

    /**
     * Recursively either adds or removes the children of a model graph.
     * Recursively traverses the graph, gets the registration of the corresponding element type,
     * checks whether it extends a DynamicChildren* abstract class and then calls the corresponding method.
     */
    public processGraphChildren(graphElement: SModelElement | SEdge, action: "set" | "remove"): void {
        const registration = this.elementRegistrations.find((r) => r.type === graphElement.type);
        if (registration) {
            // If registration is undefined some element hasn't been registered but used, so this shouldn't happen
            // if the model is valid.

            // Create a instance of the element.
            // Ideally the *Children methods should be static, but static methods can't be abstract.
            // So we need to create a instance we can then call the method on.
            const impl = new registration.constr();
            if (impl instanceof DynamicChildrenNode) {
                if (action === "set") {
                    impl.setChildren(graphElement);
                } else {
                    impl.removeChildren(graphElement);
                }
            }

            // sourceId is only present in edges and ensures that the graphElement is an edge (to calm the type system)
            if (impl instanceof DynamicChildrenEdge && "sourceId" in graphElement) {
                if (action === "set") {
                    impl.setChildren(graphElement);
                } else {
                    impl.removeChildren(graphElement);
                }
            }
        }

        graphElement.children?.forEach((child) => this.processGraphChildren(child, action));
    }
}
