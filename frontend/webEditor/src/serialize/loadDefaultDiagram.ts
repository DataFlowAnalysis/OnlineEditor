import { LoadJsonAction } from "./loadJson";
import defaultDiagram from './defaultDiagram.json'
import { SavedDiagram } from "./SavedDiagram";

export namespace LoadDefaultDiagramAction {
    export function create() {
        return LoadJsonAction.create(defaultDiagram as SavedDiagram)
    }
}