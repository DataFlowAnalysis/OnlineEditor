import { Page } from "@playwright/test";

export async function takeGraphScreenshot(page: Page) {
    const graphs = await page.locator(".sprotty-graph").all();
    if (graphs.length < 1) {
        throw "No graph element found";
    }
    if (graphs.length > 1) {
        throw "Multiple graph elements found";
    }
    return graphs[0].screenshot();
}

export async function selectById(page: Page, id: string) {
    await page.locator(id).click();
}

export async function pressKey(page: Page, ...keys: string[]) {
    await page.keyboard.press(keys.join("+"));
}

export function getControlKeyEquivalent(browserName: "chromium" | "firefox" | "webkit") {
    return browserName === "webkit" ? "Meta" : "Control";
}

export async function waitForElement(page: Page, id: string, present = true) {
    const options = present ? undefined : { state: "detached" as const };
    // @ts-expect-error This should work. Just giving it undefined does...
    return page.waitForSelector(id, options);
}

export async function isPresent(page: Page, id: string) {
    return (await page.locator(id).count()) > 0;
}

export async function init(page: Page) {
    await page.goto("/");
    await page.waitForSelector(".sprotty-graph");
}
