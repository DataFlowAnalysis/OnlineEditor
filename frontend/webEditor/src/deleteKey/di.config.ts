import { ContainerModule } from "inversify";
import { DeleteKeyListener } from "./deleteKeyListener";
import { TYPES } from "sprotty";

export const deleteKeyModule = new ContainerModule((bind) => {
    bind(DeleteKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(DeleteKeyListener);
});
