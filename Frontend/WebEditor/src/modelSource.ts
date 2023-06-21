import { injectable, multiInject } from "inversify";
import { LocalModelSource, SModelElementRegistration, TYPES } from "sprotty";
import { SModelRoot as SModelRootSchema, SModelElement as SModelElementSchema } from "sprotty-protocol";
import { ExpandableView } from "./views";

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

    public processGraph(graphElement: SModelElementSchema, action: "expand" | "retract"): void {
        const registration = this.elementRegistrations.find((r) => r.type === graphElement.type);
        if (registration) {
            const impl = new registration.constr();
            if (impl instanceof ExpandableView) {
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
