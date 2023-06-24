import { injectable, multiInject } from "inversify";
import { LocalModelSource, SModelElementRegistration, TYPES } from "sprotty";
import {
    SModelRoot as SModelRootSchema,
    SModelElement as SModelElementSchema,
    SEdge as SEdgeSchema,
} from "sprotty-protocol";
import { ExpandableEdge, ExpandableNode } from "./views";

@injectable()
export class ExpanderModelSource extends LocalModelSource {
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
            if (impl instanceof ExpandableNode) {
                if (action === "expand") {
                    impl.expand(graphElement);
                } else {
                    impl.retract(graphElement);
                }
            }

            if (impl instanceof ExpandableEdge && "sourceId" in graphElement) {
                // sourceId is only present in edges and ensures that the graphElement is an edge (to calm the type system)
                if (action === "expand") {
                    impl.expand(graphElement);
                } else {
                    impl.retract(graphElement);
                }
            }
        }

        graphElement.children?.forEach((child) => this.processGraph(child, action));
    }
}
