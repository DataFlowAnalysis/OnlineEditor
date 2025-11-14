import { inject, injectable } from "inversify";
import "./settingsUi.css";
import { SettingsValue } from "./SettingsValue";
import { AccordionUiExtension } from "../accordionUiExtension";
import { HideEdgeNames, SETTINGS, SimplifyNodeNames } from "./Settings";
import { EditorModeController } from "./editorMode";

@injectable()
export class SettingsUI extends AccordionUiExtension {
    static readonly ID = "settings-ui";

    constructor(@inject(SETTINGS.HideEdgeNames) private readonly hideEdgeNames: HideEdgeNames,
    @inject(SETTINGS.SimplifyNodeNames) private readonly simplifyNodeNames: SimplifyNodeNames,
@inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController) {
        super('right', 'up')
    }

    id(): string {
        return SettingsUI.ID;
    }

    containerClass(): string {
        return SettingsUI.ID;
    }

    protected initializeHidableContent(contentElement: HTMLElement): void {
        const grid = document.createElement('div');
        grid.id = 'settings-content'
        contentElement.appendChild(grid);
        this.addBooleanSwitch(grid, "Hide Edge Names", this.hideEdgeNames);
        this.addBooleanSwitch(grid, "Simplify Node Names", this.simplifyNodeNames);
        this.addSwitch(grid, "Read Only", this.editorModeController, {true: "view", false: "edit"});
    }

    protected initializeHeaderContent(headerElement: HTMLElement): void {
        headerElement.classList.add('settings-accordion-icon');
        headerElement.innerText = 'Settings'
    }

    private addBooleanSwitch(container: HTMLElement, title: string, value: SettingsValue<boolean>): void {
        this.addSwitch<boolean>(container, title, value, {true: true, false: false});
    }

    private addSwitch<T extends string|number|symbol|boolean>(container: HTMLElement, title: string, value: SettingsValue<T>, map: {'true':T, 'false': T}): void {
        const inversedMap = {
            [map.true.toString()]: true,
            [map.false.toString()]: false
        };
        const textLabel = document.createElement("label");
        textLabel.textContent = title;
        textLabel.htmlFor = `setting-${title.toLowerCase().replace(/\s+/g, '-')}`;

        const switchLabel = document.createElement("label");
        switchLabel.classList.add("switch");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `setting-${title.toLowerCase().replace(/\s+/g, '-')}`;
        checkbox.checked = inversedMap[value.get().toString()];
        switchLabel.appendChild(checkbox);
        const sliderSpan = document.createElement("span");
        sliderSpan.classList.add("slider", "round");
        switchLabel.appendChild(sliderSpan);

        container.appendChild(textLabel);
        container.appendChild(switchLabel);

        switchLabel.addEventListener("change", () => {
            value.set(map[checkbox.checked ? 'true' : 'false']);
        });
        value.registerListener((newValue) => {
            checkbox.checked = inversedMap[newValue.toString()];
        });
    }
}