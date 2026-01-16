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
    await page.focus(".sprotty-graph");
}

export async function getPosition(page: Page, id: string) {
    const element = await page.locator(id).first();
    if ((await element.count()) == 0) {
        throw "Element not found";
    }
    const transform = (await element.getAttribute("transform")) ?? "";
    const match = /translate\((\d+(?:\.\d+)?), *(\d+(?:\.\d+)?)\)/.exec(transform);
    if (!match) {
        return { x: 0, y: 0 };
    }
    return { x: Number(match[1]), y: Number(match[2]) };
}
