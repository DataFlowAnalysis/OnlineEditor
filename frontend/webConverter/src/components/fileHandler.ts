import { DFDModel } from "./dfd";
import { getDFDModelEndingsAsSet, getPCMModelEndingsAsSet, getWebModelEndingsAsSet, Model } from "./model";
import { PCMModel } from "./palladio";
import { WebModel } from "./web";


export function createListOfModelsFromFiles(files: File[]): Model[] {
    const endings = new Set(files.map(f => {
        const m = f.name.match(/\.([^.]+)$/);
        return m ? m[1] : "";
    }));

    console.log(endings);

    const eqSet = <T,>(xs: Set<T>, ys: Set<T>): boolean =>
        xs.size === ys.size &&
        [...xs].every((x) => ys.has(x));

    if (eqSet(endings, getWebModelEndingsAsSet())) {
        return files.map(file => new WebModel(file));
    } else if (eqSet(endings, getDFDModelEndingsAsSet())) {
        return [...groupByBaseName(files).values()].map(modelFiles => new DFDModel(modelFiles));
    } else if (eqSet(endings, getPCMModelEndingsAsSet())) {
        return [...groupByBaseName(files).values()].map(modelFiles => new PCMModel(modelFiles));
    } 
    alert("Please provide only one type of model");
    return [];
}

function groupByBaseName(files: File[]): Map<string, File[]> {
    return files.reduce((map, file) => {
        // strip off the “.extension”
        const base = file.name.replace(/\.[^.]+$/, "");
        if (!map.has(base)) {
            map.set(base, []);
        }
        map.get(base)!.push(file);
        return map;
    }, new Map<string, File[]>());
}