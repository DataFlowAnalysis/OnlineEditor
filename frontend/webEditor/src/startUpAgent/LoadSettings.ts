import { inject, injectable } from "inversify";
import { IStartUpAgent } from "./StartUpAgent";
import { HideNoErrorsLabel, SETTINGS } from "../settings/Settings";
import { URLParameters } from "../urlParameters/URLParameters";

@injectable()
export class LoadSettingsStartUpAgent implements IStartUpAgent {
    constructor(
        @inject(SETTINGS.HideNoErrorsLabel) private readonly hideNoErrorsLabel: HideNoErrorsLabel,
        @inject(URLParameters) private urlParameters: URLParameters,
    ) {}

    public run() {
        this.hideNoErrorsLabel.set(this.urlParameters.getBoolean("hideNoErrorsLabel"));
    }
}
