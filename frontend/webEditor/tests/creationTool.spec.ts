import test, { expect } from "@playwright/test";
import { getControlKeyEquivalent, init, pressKey, waitForElement } from "./utils";

test("test creation tools", async ({ page, browserName }) => {
    const CONTROL_KEY = getControlKeyEquivalent(browserName);
    await init(page);

    // clear diagram
    await pressKey(page, CONTROL_KEY, "A");
    await waitForElement(page, ".sprotty-node.selected");
    await pressKey(page, "Delete");
    await waitForElement(page, ".sprotty-node", false);
    expect(await page.locator(".sprotty-node").count()).toBe(0);
    expect(await page.locator(".sprotty-port").count()).toBe(0);
    expect(await page.locator(".sprotty-edge").count()).toBe(0);

    const toolPalette = page.locator("#sprotty_tool-palette");

    const storageNode = await placeNode(0, "storage");
    const ioNode = await placeNode(1, "input-output");
    await placeNode(2, "function");

    const inputPort = await placePort(4, "#" + storageNode);
    const outputPort = await placePort(5, "#" + ioNode);

    await clickToolPalette(3);
    await page.click("#" + outputPort, { force: true });
    await page.click("#" + inputPort, { force: true });
    await waitForElement(page, ".sprotty-edge");
    expect(await page.locator(".sprotty-edge").count()).toBe(1);

    function clickToolPalette(index: number) {
        return toolPalette.locator(":scope > .tool").nth(index).click();
    }

    async function placeNode(index: number, type: string) {
        await clickToolPalette(index);
        await page.click("#sprotty_root", { position: { x: 200, y: 100 + index * 100 }, force: true });
        const selector = `.sprotty-node.${type}`;
        await waitForElement(page, selector);
        const newNode = page.locator(selector);
        expect(await newNode.count()).toBe(1);
        return (await newNode.getAttribute("id"))!;
    }

    async function placePort(index: number, node: string) {
        await clickToolPalette(index);
        // we hover and then move to avoid clicking the annotation ui
        await page.hover(node, { position: { x: 50, y: 10 } });
        await page.waitForTimeout(750);
        await page.click(node, { position: { x: 10, y: 10 }, force: true });
        const selector = `${node} > .sprotty-port`;
        await waitForElement(page, selector);
        const newPort = page.locator(selector);
        expect(await newPort.count()).toBe(1);
        return (await newPort.getAttribute("id"))!;
    }
});
