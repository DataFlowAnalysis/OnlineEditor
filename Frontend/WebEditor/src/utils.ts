import { ServiceIdentifierOrFunc, inject } from "inversify/lib/annotation/inject";

export const EDITOR_TYPES = {
    IDefaultTool: Symbol("IDefaultTool"),
};

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
