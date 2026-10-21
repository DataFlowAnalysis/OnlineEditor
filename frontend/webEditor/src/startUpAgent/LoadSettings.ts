import { inject, injectable } from "inversify";
import { IStartUpAgent } from "./StartUpAgent";
import { HideEdgeNames, HideNoErrorsLabel, SETTINGS, SimplifyNodeNames } from "../settings/Settings";
import { URLParameters } from "../urlParameters/URLParameters";
import { ThemeManager } from "../settings/Theme";
import { SettingsValue } from "../settings/SettingsValue";
import { ShownLabelsValue } from "../settings/ShownLabels";
import { BackEndURL } from "../dfdApiClient/backendUrl";

@injectable()
export class LoadSettingsStartUpAgent implements IStartUpAgent {
    constructor(
        @inject(SETTINGS.Theme) private readonly theme: ThemeManager,
        @inject(SETTINGS.ShownLabels) private readonly shownLabels: ShownLabelsValue,
        @inject(SETTINGS.HideNoErrorsLabel) private readonly hideNoErrorsLabel: HideNoErrorsLabel,
        @inject(SETTINGS.HideEdgeNames) private readonly hideEdgeNames: HideEdgeNames,
        @inject(SETTINGS.SimplifyNodeNames) private readonly simplifyNodeNames: SimplifyNodeNames,
        @inject(SETTINGS.BackEndURL) private readonly backendUrl: BackEndURL,
        @inject(URLParameters) private urlParameters: URLParameters,
    ) {}

    public run() {
        this.setSetting(this.theme, "theme");
        this.setSetting(this.shownLabels, "shownLabels");
        this.setSetting(this.backendUrl, "backend");

        this.hideNoErrorsLabel.set(this.urlParameters.getBoolean("hideNoErrorsLabel"));
        this.hideEdgeNames.set(this.urlParameters.getBoolean("hideEdgeNames"));
        this.simplifyNodeNames.set(this.urlParameters.getBoolean("simplifyNodeNames"));
    }

    private setSetting<T>(value: SettingsValue<T>, key: string) {
        if (this.urlParameters.get(key) !== undefined) {
            value.set(this.urlParameters.get(key) as T);
        }
    }
}
