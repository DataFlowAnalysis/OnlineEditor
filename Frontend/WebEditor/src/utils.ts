import { ServiceIdentifierOrFunc, inject } from "inversify/lib/annotation/inject";

/**
 * Type identifiers for use with inversify.
 */
export const EDITOR_TYPES = {
    // All sprotty tools that are bound to this symbol will
    // be loaded and enabled at editor startup.
    IDefaultTool: Symbol("IDefaultTool"),
    // sprotty tools that should be registered but not enabled by default.
    ITool: Symbol("ITool"),
};

export const FIT_TO_SCREEN_PADDING = 75;

/**
 * A wrapper decorator for inversify's `inject` decorator.
 * This is necessary because with TypeScript 5.x a decorator must accept targetKey as an optional parameter
 * when having a decoration inside a constructor parameter.
 */
export function constructorInject(
    identifier: ServiceIdentifierOrFunc,
): (target: any, targetKey?: string, index?: number | PropertyDescriptor | undefined) => void {
    return (target, targetKey, index) => {
        // inversify is handling passing undefined as targetKey just fine.
        // It is just the type definition of the inject function that is wrong.
        inject(identifier)(target, targetKey!, index);
    };
}

export function generateRandomSprottyId(): string {
    return Math.random().toString(36).substring(7);
}

const context = document.createElement("canvas").getContext("2d");
export function calculateTextWidth(text: string | undefined, font: string = "11pt sans-serif"): number {
    if (!context) {
        throw new Error("Could not create canvas context used to measure text width");
    }

    if (!text || text.length === 0) {
        return 20;
    }

    context.font = font;
    const metrics = context.measureText(text);
    return Math.round(metrics.width);
}
