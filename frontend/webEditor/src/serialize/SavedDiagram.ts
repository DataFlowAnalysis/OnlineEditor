import { SModelRoot } from "sprotty-protocol";
import { Constraint } from "../constraint/Constraint";
import { LabelType } from "../labels/LabelType";
import { EditorMode } from "../settings/editorMode";

export interface SavedDiagram {
    model: SModelRoot;
    labelTypes?: LabelType[];
    constraints?: Constraint[];
    mode?: EditorMode;
    version: number;
}
export const CURRENT_VERSION = 1;