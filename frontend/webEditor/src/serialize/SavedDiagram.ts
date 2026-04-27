import { SModelRoot } from "sprotty-protocol";
import { Constraint } from "../constraint/Constraint";
import { LabelType } from "../labels/LabelType";
import { EditorMode } from "../settings/editorMode";
import { Violation } from "../violationUi/Violation";

export interface SavedDiagram {
    model: SModelRoot;
    labelTypes?: LabelType[];
    constraints?: Constraint[];
    mode?: EditorMode;
    version: number;
    violations?: Violation[];
}
export const CURRENT_VERSION = 1;
