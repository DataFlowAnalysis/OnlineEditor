import { BoolSettingsValue } from "./SettingsValue";

export const SETTINGS = {
    Theme: Symbol("Theme"),
    Mode: Symbol("EditorMode"),
    HideEdgeNames: Symbol("HideEdgeNames"),
    SimplifyNodeNames: Symbol("SimplifyNodeNames"),
    ShownLabels: Symbol("ShownLabels"),
    BackEndURL: Symbol("BackEndURL"),
    HideNoErrorsLabel: Symbol("HideNoErrorsLabel"),
};

export type SimplifyNodeNames = BoolSettingsValue;
export type HideEdgeNames = BoolSettingsValue;
export type HideNoErrorsLabel = BoolSettingsValue;
