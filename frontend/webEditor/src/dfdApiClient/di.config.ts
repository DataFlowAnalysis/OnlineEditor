import { ContainerModule } from "inversify";
import { DfdApiClient } from "./dfdApiClient";
import { BackEndURL } from "./backendUrl";
import { SETTINGS } from "../settings/Settings";

export const dfdApiModule = new ContainerModule((bind) => {
    bind(BackEndURL).toSelf().inSingletonScope();
    bind(SETTINGS.BackEndURL).toService(BackEndURL);

    bind(DfdApiClient).toSelf().inSingletonScope();
});
