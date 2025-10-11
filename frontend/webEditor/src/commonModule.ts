import { ContainerModule } from "inversify";
import { TYPES, LocalModelSource, ConsoleLogger, LogLevel, configureViewerOptions } from "sprotty";

export const commonModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn); // TODO: set to log again
    const context = { bind, unbind, isBound, rebind };
    configureViewerOptions(context, {
        zoomLimits: { min: 0.05, max: 20 },
    });
});