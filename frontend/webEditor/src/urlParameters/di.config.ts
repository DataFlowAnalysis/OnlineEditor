import { ContainerModule } from "inversify";
import { URLParameters } from "./URLParameters";

export const urlParamatersModule = new ContainerModule((bind) => {
    bind(URLParameters).toSelf().inSingletonScope();
});
