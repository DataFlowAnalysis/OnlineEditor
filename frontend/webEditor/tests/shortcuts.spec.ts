import { test, expect } from "@playwright/test";
import {
    getControlKeyEquivalent,
    init,
    isPresent,
    pressKey,
    selectById,
    takeGraphScreenshot,
    waitForElement,
} from "./utils";

test("delte, undo, redo", async ({ page, browserName }) => {
    const ID = "sprotty_8j2r1g";
    const HTML_ID = "#" + ID;
    const CONTROL_KEY = getControlKeyEquivalent(browserName);
    await init(page);
    expect(await isPresent(page, HTML_ID)).toBeTruthy();
    const originalScreenshot = await takeGraphScreenshot(page);

    await selectById(page, HTML_ID);
    await pressKey(page, "Delete");
    await waitForElement(page, HTML_ID, false);
    expect(await isPresent(page, HTML_ID)).toBeFalsy();
    const removedScreenshot = await takeGraphScreenshot(page);
    expect(removedScreenshot).not.toEqual(originalScreenshot);

    await pressKey(page, CONTROL_KEY, "Z");
    await waitForElement(page, HTML_ID, true);
    expect(await isPresent(page, HTML_ID)).toBeTruthy();
    const undoScreenshot = await takeGraphScreenshot(page);
    expect(undoScreenshot).not.toEqual(removedScreenshot);

    await pressKey(page, CONTROL_KEY, "Shift", "Z");
    await waitForElement(page, HTML_ID, false);
    expect(await isPresent(page, HTML_ID)).toBeFalsy();
    const redoScreenshot = await takeGraphScreenshot(page);
    expect(redoScreenshot).not.toEqual(undoScreenshot);
});
