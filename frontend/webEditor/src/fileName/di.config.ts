import { ContainerModule } from "inversify";
import { FileName } from "./fileName";

export const fileNameModule = new ContainerModule((bind) => {
    bind(FileName).toSelf().inSingletonScope();
})