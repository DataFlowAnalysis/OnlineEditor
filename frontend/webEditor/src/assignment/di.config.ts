import { ContainerModule } from "inversify";
import { AssignmentEditUi } from "./AssignmentEditUi";
import { TYPES } from "sprotty";
import { OutputPortEditUIMouseListener } from "./clickListener";

export const assignmentModule = new ContainerModule((bind) => {
    bind(AssignmentEditUi).toSelf().inSingletonScope()
    bind(TYPES.IUIExtension).toService(AssignmentEditUi);

    bind(TYPES.MouseListener).to(OutputPortEditUIMouseListener).inSingletonScope();
})