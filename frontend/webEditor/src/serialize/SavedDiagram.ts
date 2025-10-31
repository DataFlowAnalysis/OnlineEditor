import { SModelRoot } from "sprotty-protocol";
import { Constraint } from "../constraint/Constraint";
import { EditorMode } from "../editorMode/EditorMode";
import { LabelType } from "../labels/LabelType";

export interface SavedDiagram {
    model: SModelRoot;
    labelTypes?: LabelType[];
    constraints?: Constraint[];
    mode?: EditorMode;
    version: number;
}
export const CURRENT_VERSION = 1;