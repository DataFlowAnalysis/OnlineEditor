import { injectable } from "inversify";
import { SChildElementImpl, SModelElementImpl, SModelFactory, SParentElementImpl } from "sprotty";
import { DfdNode } from "./nodes/common";
import { SLabel, SModelElement } from "sprotty-protocol";

@injectable()
export class CustomModelFactory extends SModelFactory {
    override createElement(schema: SModelElement | SModelElementImpl, parent?: SParentElementImpl): SChildElementImpl {
        if (
            (schema.type === "node:storage" ||
                schema.type === "node:function" ||
                schema.type === "node:input-output") &&
            !(schema instanceof SModelElementImpl)
        ) {
            const dfdSchema = schema as DfdNode;
            schema.children = schema.children ?? [];
            for (const port of dfdSchema.ports) {
                if ("features" in port) {
                    delete port.features
                }
            }
            schema.children.push(...dfdSchema.ports, {
                type: "label:positional",
                text: dfdSchema.text ?? "",
                id: schema.id + "-label",
            } as SLabel);
        }

        return super.createElement(schema, parent);
    }
}
