import { SettingsValue } from "./SettingsValue";

export enum ShownLabels {
    INCOMING = "Incoming",
    OUTGOING = "Outgoing",
    ALL = "All",
}

export class ShownLabelsValue extends SettingsValue<ShownLabels> {
    constructor() {
        super(ShownLabels.ALL);
    }
}
