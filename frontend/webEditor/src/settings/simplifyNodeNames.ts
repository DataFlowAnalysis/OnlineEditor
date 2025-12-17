import { inject, injectable } from "inversify";
import { Command, CommandExecutionContext, CommandReturn, SParentElementImpl, TYPES } from "sprotty";
import { DfdNodeImpl } from "../diagram/nodes/common";
import { Action } from "sprotty-protocol";
import { SETTINGS, SimplifyNodeNames } from "./Settings";

@injectable()
export class NodeNameRegistry {
    private plainNames: Map<string, string>;
    private anonymousNames: Map<string, number>;
    private nextNummber = 1;

    constructor() {
        this.plainNames = new Map<string, string>();
        this.anonymousNames = new Map<string, number>();
    }

    public setPlainName(node: DfdNodeImpl) {
        if (node.editableLabel && this.plainNames.has(node.id)) {
            node.editableLabel.text = this.plainNames.get(node.id)!;
        }
    }

    public setAnonymousName(node: DfdNodeImpl) {
        if (node instanceof DfdNodeImpl && node.editableLabel) {
            this.plainNames.set(node.id, node.editableLabel.text);
        }
        if (!this.anonymousNames.has(node.id)) {
            this.anonymousNames.set(node.id, this.nextNummber);
            this.nextNummber++;
        }
        if (node.editableLabel) {
            node.editableLabel.text = this.anonymousNames.get(node.id)!.toString();
        }
    }
}

export namespace SimplifyNodeNamesAction {
    export const KIND = "simplify-node-names";
    export function create(): Action {
        return {
            kind: KIND,
        };
    }
}

export class SimplifyNodeNamesCommand extends Command {
    static readonly KIND = SimplifyNodeNamesAction.KIND;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(NodeNameRegistry) private readonly nodeNameRegistry: NodeNameRegistry,
        @inject(SETTINGS.SimplifyNodeNames) private readonly simplifyNodeNames: SimplifyNodeNames,
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.iterate(context.root, (n) =>
            this.simplifyNodeNames.get()
                ? this.nodeNameRegistry.setAnonymousName(n)
                : this.nodeNameRegistry.setPlainName(n),
        );
        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    iterate(node: SParentElementImpl, f: (n: DfdNodeImpl) => void) {
        if (node instanceof DfdNodeImpl) {
            f(node);
        }

        for (const child of node.children) {
            this.iterate(child, f);
        }
    }
}
