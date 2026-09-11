import { inject, injectable } from "inversify";
import { IStartUpAgent } from "./StartUpAgent";
import { HideNoErrorsLabel, SETTINGS } from "../settings/Settings";

@injectable()
export class LoadSettingsStartUpAgent implements IStartUpAgent {
    constructor(@inject(SETTINGS.HideNoErrorsLabel) private readonly hideNoErrorsLabel: HideNoErrorsLabel) {}

    public run() {
        const hideNoErrorsLabelValue = new URLSearchParams(window.location.search).get("hideNoErrorsLabel") === "true";

        this.hideNoErrorsLabel.set(hideNoErrorsLabelValue);
    }
}
