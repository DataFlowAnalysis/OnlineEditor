export enum ModelEndingsWeb {
    json = "json",
}

export function getWebModelEndingsAsSet(): Set<string> {
    return new Set(Object.values(ModelEndingsWeb));
}

export enum ModelEndingsDFD {
    datadictionary = "datadictionary",
    dataflowdiagram = "dataflowdiagram",
}

export function getDFDModelEndingsAsSet(): Set<string> {
    return new Set(Object.values(ModelEndingsDFD));
}

export enum ModelEndingsPalladio {
    PDDC = "pddc",
    ALLOCATION = "allocation",
    NODE_CHARACTER = "nodecharacteristics",
    REPOSITORY = "repository",
    RESOURCE_ENV = "resourceenvironment",
    SYSTEM = "system",
    USAGEMODEL = "usagemodel"
}

export function getPCMModelEndingsAsSet(): Set<string> {
    return new Set(Object.values(ModelEndingsPalladio));
}

export abstract class Model {
    abstract convertToMessage(): Promise<string>;
    abstract getName(): string;
    abstract getType(): string;
    abstract isValid(): boolean;
}

export async function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}