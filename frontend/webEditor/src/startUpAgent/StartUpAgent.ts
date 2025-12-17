export interface IStartUpAgent {
    run(): void;
}

export const StartUpAgent = Symbol("StartUpAgent");
