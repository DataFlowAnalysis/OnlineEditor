import { injectable } from "inversify";
import { SChildElementImpl, SModelElementImpl, SModelFactory, SParentElementImpl } from "sprotty";
import { DfdNode } from "../diagram/nodes/common";
import { getBasicType, SLabel, SModelElement } from "sprotty-protocol";
import { ArrowEdge } from "../diagram/edges/ArrowEdge";

@injectable()
export class DfdModelFactory extends SModelFactory {
    override createElement(schema: SModelElement | SModelElementImpl, parent?: SParentElementImpl): SChildElementImpl {
        if (schema instanceof SModelElementImpl) {
            return super.createElement(schema, parent);
        }
        if (schema.type === "node:storage" || schema.type === "node:function" || schema.type === "node:input-output") {
            const dfdSchema = schema as DfdNode;
            schema.children = schema.children ?? [];
            for (const port of dfdSchema.ports) {
                if ("features" in port) {
                    delete port.features;
                }
            }
            schema.children.push(...dfdSchema.ports, {
                type: "label:positional",
                text: dfdSchema.text ?? "",
                id: schema.id + "-label",
            } as SLabel);
        }

        if (schema.type === "edge:arrow") {
            const dfdSchema = schema as ArrowEdge;
            schema.children = schema.children ?? [];
            schema.children.push({
                type: "label:filled-background",
                text: dfdSchema.text ?? "",
                id: schema.id + "-label",
                edgePlacement: {
                    position: 0.5,
                    side: "on",
                    rotate: false,
                },
            } as SLabel);
        }

        if ("features" in schema) {
            delete schema["features"];
        }
        const element = super.createElement(schema, parent);
        if (element.features === undefined) {
            element.features = new Set<symbol>();
        }
        return element;
    }

    override createSchema(element: SModelElementImpl): SModelElement {
        const schema = super.createSchema(element);

        if (schema.type === "node:storage" || schema.type === "node:function" || schema.type === "node:input-output") {
            const dfdSchema = schema as DfdNode;
            const ports = dfdSchema.children?.filter((child) => getBasicType(child) === "port") ?? [];
            dfdSchema.ports = ports;

            const labelValue = schema.children?.find((child) => child.type === "label:positional") as
                | SLabel
                | undefined;

            if (labelValue) {
                dfdSchema.text = labelValue.text;
            }

            dfdSchema.children = [];
            return dfdSchema;
        }

        if (schema.type === "edge:arrow") {
            const dfdSchema = schema as ArrowEdge;

            const labelValue = schema.children?.find((child) => child.type === "label:filled-background") as
                | SLabel
                | undefined;

            if (labelValue) {
                dfdSchema.text = labelValue.text;
            }

            dfdSchema.children = [];
            return dfdSchema;
        }

        return schema;
    }
}
