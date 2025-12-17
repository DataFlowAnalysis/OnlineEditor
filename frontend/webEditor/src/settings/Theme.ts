import { SettingsValue } from "./SettingsValue";

export enum Theme {
    LIGHT = "Light",
    DARK = "Dark",
    SYSTEM_DEFAULT = "System Default",
}

export type ApplyableTheme = Theme.LIGHT | Theme.DARK;

export class ThemeManager extends SettingsValue<Theme> {
    private static SYSTEM_DEFAULT: ApplyableTheme =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? Theme.DARK : Theme.LIGHT;
    public static readonly LOCAL_STORAGE_KEY = "dfdwebeditor:theme";

    constructor() {
        super((localStorage.getItem(ThemeManager.LOCAL_STORAGE_KEY) ?? ThemeManager.SYSTEM_DEFAULT) as Theme);
    }

    getTheme(): ApplyableTheme {
        const value = this.get();
        if (value === Theme.SYSTEM_DEFAULT) {
            return ThemeManager.SYSTEM_DEFAULT;
        }
        return value;
    }
}

export const ThemeSwitchable = Symbol("ThemeSwitchable");

export interface ThemeSwitchable {
    switchTheme: (newTheme: ApplyableTheme) => void;
}

export function registerThemeSwitch(themeManager: ThemeManager, switchables: ThemeSwitchable[]) {
    themeManager.registerListener(() => {
        setTheme(themeManager, switchables);
    });
    setTheme(themeManager, switchables);
}

function setTheme(themeManager: ThemeManager, switchables: ThemeSwitchable[]) {
    const rootElement = document.querySelector(":root") as HTMLElement;
    const sprottyElement = document.querySelector("#sprotty") as HTMLElement;

    const value = themeManager.getTheme() === Theme.DARK ? "dark" : "light";
    rootElement.setAttribute("data-theme", value);
    sprottyElement.setAttribute("data-theme", value);
    localStorage.setItem(ThemeManager.LOCAL_STORAGE_KEY, themeManager.get());

    switchables.forEach((s) => s.switchTheme(themeManager.getTheme()));
}
