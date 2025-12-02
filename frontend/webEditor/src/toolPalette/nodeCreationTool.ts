import { injectable } from "inversify";
import { SNodeImpl } from "sprotty";
import { SNode } from "sprotty-protocol";
import { CreationTool } from "./creationTool";
import { generateRandomSprottyId } from "../utils/idGenerator";

/**
 * Creates a node when the user clicks somewhere on the root graph.
 * The type of the node can be set using the parameter in the enable function.
 * Automatically disables itself after creating a node.
 */
@injectable()
export class NodeCreationTool extends CreationTool<SNode, SNodeImpl> {
    createElementSchema(): SNode {
        const defaultText = this.elementType.replace("node:", "");
        const defaultTextCapitalized = defaultText.charAt(0).toUpperCase() + defaultText.slice(1);

        return {
            id: generateRandomSprottyId(),
            type: this.elementType,
            text: defaultTextCapitalized,
            ports: [],
            labels: []
        } as SNode;
    }
}
