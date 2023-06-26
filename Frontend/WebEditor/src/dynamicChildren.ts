import { injectable, multiInject } from "inversify";
import { LocalModelSource, SModelElementRegistration, SNode, SEdge, TYPES } from "sprotty";
import {
    SModelRoot as SModelRootSchema,
    SModelElement as SModelElementSchema,
    SEdge as SEdgeSchema,
    SNode as SNodeSchema,
} from "sprotty-protocol";

export abstract class DynamicChildrenNode extends SNode {
    abstract setChildren(schema: SNodeSchema): void;
    abstract removeChildren(schema: SNodeSchema): void;
}

export abstract class DynamicChildrenEdge extends SEdge {
    abstract setChildren(schema: SEdgeSchema): void;
    abstract removeChildren(schema: SEdgeSchema): void;
}

@injectable()
export class DynamicChildrenModelSource extends LocalModelSource {
    @multiInject(TYPES.SModelElementRegistration)
    private readonly elementRegistrations: SModelElementRegistration[] = [];

    get model(): SModelRootSchema {
        const copy = JSON.parse(JSON.stringify(this.currentRoot));
        this.processGraph(copy, "retract");

        return copy;
    }

    set model(root: SModelRootSchema) {
        this.processGraph(root, "expand");
        this.setModel(root);
    }

    public processGraph(graphElement: SModelElementSchema | SEdgeSchema, action: "expand" | "retract"): void {
        const registration = this.elementRegistrations.find((r) => r.type === graphElement.type);
        if (registration) {
            const impl = new registration.constr();
            if (impl instanceof DynamicChildrenNode) {
                if (action === "expand") {
                    impl.setChildren(graphElement);
                } else {
                    impl.removeChildren(graphElement);
                }
            }

            if (impl instanceof DynamicChildrenEdge && "sourceId" in graphElement) {
                // sourceId is only present in edges and ensures that the graphElement is an edge (to calm the type system)
                if (action === "expand") {
                    impl.setChildren(graphElement);
                } else {
                    impl.removeChildren(graphElement);
                }
            }
        }

        graphElement.children?.forEach((child) => this.processGraph(child, action));
    }
}
