import { inject, injectable } from "inversify";
import { ActionDispatcher, TYPES } from "sprotty";
import { ChangeEdgeLabelVisibilityAction, SimplifyNodeNamesAction } from "./actions";
import { Mode } from "./annotationManager";

@injectable()
export class SettingsManager {
    private _hideEdgeLabels = false;
    private _hideEdgeLabelsCheckbox?: HTMLInputElement;
    private _simplifyNodeNames = false;
    private _simplifyNodeNamesCheckbox?: HTMLInputElement;
    private _labelModeSelector?: HTMLSelectElement;

    constructor(@inject(TYPES.IActionDispatcher) protected readonly dispatcher: ActionDispatcher) {
    }


    public get hideEdgeLabels(): boolean {
        return this._hideEdgeLabels;
    }

    public set hideEdgeLabels(hideEdgeLabels: boolean) {
        this._hideEdgeLabels = hideEdgeLabels;
        if (this._hideEdgeLabelsCheckbox) {
            this._hideEdgeLabelsCheckbox.checked = hideEdgeLabels;
        }
    }

    public bindHideEdgeLabelsCheckbox(checkbox: HTMLInputElement) {
        this._hideEdgeLabelsCheckbox = checkbox;
        this._hideEdgeLabelsCheckbox.checked = this._hideEdgeLabels;
        this._hideEdgeLabelsCheckbox.addEventListener("change", () => {
            this.dispatcher.dispatch(ChangeEdgeLabelVisibilityAction.create(this._hideEdgeLabelsCheckbox!.checked));
        });
    }

    public get simplifyNodeNames(): boolean {
        return this._simplifyNodeNames;
    }

    public set simplifyNodeNames(simplifyNodeNames: boolean) {
        this._simplifyNodeNames = simplifyNodeNames;
        if (this._simplifyNodeNamesCheckbox) {
            this._simplifyNodeNamesCheckbox.checked = simplifyNodeNames;
        }
    }

    public bindSimplifyNodeNamesCheckbox(checkbox: HTMLInputElement) {
        this._simplifyNodeNamesCheckbox = checkbox;
        this._simplifyNodeNamesCheckbox.checked = this._simplifyNodeNames;
        this._simplifyNodeNamesCheckbox.addEventListener("change", () => {
            this.dispatcher.dispatch(
                SimplifyNodeNamesAction.create(this._simplifyNodeNamesCheckbox!.checked ? "hide" : "show"),
            );
        });
    }

    public bindLabelModeSelector(labelModeSelector: HTMLSelectElement) {
        this._labelModeSelector = labelModeSelector;
        labelModeSelector.value = Mode.INCOMING;
    }

    public getCurrentLabelMode(): Mode {
        return this._labelModeSelector!.value as Mode;
    }
}
