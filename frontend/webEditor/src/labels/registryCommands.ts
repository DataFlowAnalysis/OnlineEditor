import { Action } from "sprotty-protocol";
import { LabelTypeRegistry } from "./LabelTypeRegistry";
import { Command, CommandExecutionContext, CommandReturn, SParentElementImpl, TYPES } from "sprotty";
import { DfdNodeImpl } from "../diagram/nodes/common";
import { LabelAssignment } from "./LabelType";
import { inject } from "inversify";

// TODO: readd
abstract class LabelCommand implements Command {

    constructor(protected labelTypeRegistry: LabelTypeRegistry) {}
    abstract execute(context: CommandExecutionContext): CommandReturn
    abstract undo(context: CommandExecutionContext): CommandReturn 
    abstract redo(context: CommandExecutionContext): CommandReturn

    addLabelType() {
        return this.labelTypeRegistry.registerLabelType('').id
    }

    deleteLabelType(id: string, root: SParentElementImpl) {
        this.labelTypeRegistry.unregisterLabelType(id)
        this.removeLabelAssignments(root, (a) => a.labelTypeId === id)
    }

    addLabelTypeValue(typeId: string) {
        return this.labelTypeRegistry.registerLabelTypeValue(typeId, "").id
    }

    deleteLabelTypeValue(typeId: string, valueId: string, root: SParentElementImpl) {
        this.labelTypeRegistry.unregisterLabelTypeValue(typeId, valueId)
        this.removeLabelAssignments(root, (a) => a.labelTypeId === typeId && a.labelTypeValueId === valueId)
    }

    removeLabelAssignments(node: SParentElementImpl, filter: (s: LabelAssignment) => boolean) {
        if (node instanceof DfdNodeImpl) {
            node.labels = node.labels.filter(filter)
        }
        for (const child of node.children) {
            this.removeLabelAssignments(child, filter)
        }
    }
}

export namespace AddLabelTypeAction {
    export const KIND = 'add-label-type'
    export function create(): Action {
        return { kind: KIND}
    }
}

export class AddLabelTypeCommand extends LabelCommand {
    static readonly KIND = AddLabelTypeAction.KIND
    private addedId?: string

    constructor(@inject(TYPES.Action) _: Action, @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry) {
        super(labelTypeRegistry)
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.addedId = this.addLabelType()
        return context.root
    }
    undo(context: CommandExecutionContext): CommandReturn {
        this.deleteLabelType(this.addedId!, context.root)
        return context.root
    }
    redo(context: CommandExecutionContext): CommandReturn {
        this.addedId = this.addLabelType()
        return context.root
    }
}

interface AddLabelTypeValueAction extends Action {
    typeId: string
}

namespace AddLabelTypeValueAction {
    export const KIND = 'add-label-type-value'
    export function create(typeId: string): AddLabelTypeValueAction {
        return {
            kind: KIND,
            typeId
        }
    }
}

export class AddLabelTypeValueCommand extends LabelCommand {
    static readonly KIND = AddLabelTypeValueAction.KIND
    private addedId?: string

    constructor(@inject(TYPES.Action) private action: AddLabelTypeValueAction, @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry) {
        super(labelTypeRegistry)
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.addedId = this.addLabelTypeValue(this.action.typeId)
        return context.root
    }
    undo(context: CommandExecutionContext): CommandReturn {
        this.deleteLabelTypeValue(this.action.typeId, this.addedId!, context.root)
        return context.root
    }
    redo(context: CommandExecutionContext): CommandReturn {
        this.addedId = this.addLabelTypeValue(this.action.typeId)
        return context.root
    }
}