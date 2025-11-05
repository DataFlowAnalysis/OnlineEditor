import { injectable } from "inversify";
import { SChildElementImpl, SModelElementImpl, SModelFactory, SParentElementImpl } from "sprotty";
import { DfdNode } from "../diagram/nodes/common";
import { getBasicType, SLabel, SModelElement } from "sprotty-protocol";

@injectable()
export class DfdModelFactory extends SModelFactory {
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

    override createSchema(element: SModelElementImpl): SModelElement {
        const schema = super.createSchema(element);

        if (
            (schema.type === "node:storage" ||
                schema.type === "node:function" ||
                schema.type === "node:input-output") &&
            (element instanceof SModelElementImpl)
        ) {
            const dfdSchema = schema as DfdNode;
            const ports = dfdSchema.children?.filter(
                (child) =>
                    getBasicType(child) === 'port'
            ) ?? [];
            dfdSchema.ports = ports

            const labelValue = schema.children?.find(
                (child) => child.type === "label:positional"
            ) as SLabel | undefined;

            if (labelValue) {
                dfdSchema.text = labelValue.text;
            }            

            dfdSchema.children = []
            return dfdSchema
        }

        return schema;
    }
}
