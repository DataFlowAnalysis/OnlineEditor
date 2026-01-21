import { test, expect } from "@playwright/test";
import {
    getControlKeyEquivalent,
    getPosition,
    init,
    isPresent,
    pressKey,
    selectById,
    takeGraphScreenshot,
    waitForElement,
} from "./utils";

test("delte, undo, redo", async ({ page, browserName }) => {
    const ID = "#sprotty_8j2r1g";
    const CONTROL_KEY = getControlKeyEquivalent(browserName);
    await init(page);
    expect(await isPresent(page, ID)).toBeTruthy();
    const originalScreenshot = await takeGraphScreenshot(page);

    await selectById(page, ID);
    await pressKey(page, "Delete");
    await waitForElement(page, ID, false);
    expect(await isPresent(page, ID)).toBeFalsy();
    const removedScreenshot = await takeGraphScreenshot(page);
    expect(removedScreenshot).not.toEqual(originalScreenshot);

    await pressKey(page, CONTROL_KEY, "Z");
    await waitForElement(page, ID, true);
    expect(await isPresent(page, ID)).toBeTruthy();
    const undoScreenshot = await takeGraphScreenshot(page);
    expect(undoScreenshot).not.toEqual(removedScreenshot);

    await pressKey(page, CONTROL_KEY, "Shift", "Z");
    await waitForElement(page, ID, false);
    expect(await isPresent(page, ID)).toBeFalsy();
    const redoScreenshot = await takeGraphScreenshot(page);
    expect(redoScreenshot).not.toEqual(undoScreenshot);
});

test("layout", async ({ page, browserName }) => {
    const ID = "#sprotty_4myuyr";
    const CONTROL_KEY = getControlKeyEquivalent(browserName);
    await init(page);
    const originalScreenshot = await takeGraphScreenshot(page);
    const originalPostion = await getPosition(page, ID);

    await pressKey(page, CONTROL_KEY, "L");
    await page.waitForTimeout(1000);

    const newScreenshot = await takeGraphScreenshot(page);
    const newPosition = await getPosition(page, ID);

    expect(newPosition).not.toEqual(originalPostion);
    expect(newScreenshot).not.toEqual(originalScreenshot);
});
