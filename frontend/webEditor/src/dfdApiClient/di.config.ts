import { ContainerModule } from "inversify";
import { DfdApiClient } from "./dfdApiClient";

export const dfdApiModule = new ContainerModule((bind) => {
    bind(DfdApiClient).toSelf().inSingletonScope();
});
