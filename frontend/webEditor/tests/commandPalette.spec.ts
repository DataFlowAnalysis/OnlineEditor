import test, { expect, Page } from "@playwright/test";
import { getZoom, init, pressKey, takeGraphScreenshot, focus, getPosition } from "./utils";

const COMMAND_PALETTE_ID = "#sprotty_command-palette";

test("Test filter working", async ({ page }) => {
    const LOAD = "Load";
    const SAVE = "Save";
    const LOAD_DEFAULT = "Load default diagram";
    const FIT = "Fit to Screen";
    const LAYOUT = "Layout diagram";

    await init(page);
    await openPalette(page);
    await expectNames([LOAD, SAVE, LOAD_DEFAULT, FIT, LAYOUT], {
        [LOAD]: ["JSON", "DFD and DD", "Palladio"],
        [SAVE]: ["JSON", "DFD and DD"],
        [LAYOUT]: ["Lines", "Wrapping Lines", "Circles"],
    });

    const input = page.locator(COMMAND_PALETTE_ID + " > input");

    // test filter by parent category. should be case insensitive
    await input.fill("Load");
    await expectNames([LOAD, LOAD_DEFAULT], { [LOAD]: ["JSON", "DFD and DD", "Palladio"] });
    await input.fill("load");
    await expectNames([LOAD, LOAD_DEFAULT], { [LOAD]: ["JSON", "DFD and DD", "Palladio"] });

    // test filter by child category. should be case insensitive
    await input.fill("JSON");
    await expectNames([LOAD, SAVE], { [LOAD]: ["JSON"], [SAVE]: ["JSON"] });
    await input.fill("json");
    await expectNames([LOAD, SAVE], { [LOAD]: ["JSON"], [SAVE]: ["JSON"] });

    // test for something that appears in both (LAyout, PalLAdio)
    await input.fill("LA");
    await expectNames([LOAD, LAYOUT], { [LOAD]: ["Palladio"], [LAYOUT]: ["Lines", "Wrapping Lines", "Circles"] });

    async function expectNames(names: string[], children?: Record<string, string[]>) {
        const suggestions = page.locator(COMMAND_PALETTE_ID + " .command-palette-suggestions-holder > *");
        expect(await suggestions.count(), names.join(", ")).toEqual(names.length);

        for (let i = 0; i < names.length; i++) {
            const suggestionName = await suggestions
                .nth(i)
                .locator(":scope > .command-palette-suggestion-label")
                .innerText();
            expect(suggestionName).toContain(names[i]);

            if (children !== undefined && children[names[i]] !== undefined) {
                const expectedChildren = children[names[i]]!;
                const foundChildren = suggestions.nth(i).locator(":scope > .command-palette-suggestion-children > *");
                expect(await foundChildren.count(), `Children of: ${names[i]}; ${expectedChildren.join(", ")}`).toEqual(
                    expectedChildren.length,
                );

                for (let j = 0; j < expectedChildren.length; j++) {
                    const childName = await foundChildren
                        .nth(j)
                        .locator(":scope > .command-palette-suggestion-label")
                        .innerText();
                    expect(childName).toContain(expectedChildren[j]);
                }
            }
        }
    }
});

// skipped due to bug when no file (will need files eventually, but no file should still be tested)
test.skip("Test load", async ({ page }) => {
    await init(page);

    await testWithFileChooser(0, ["json"], false);
    await testWithFileChooser(1, ["dataflowdiagram", "datadictionary"], true);
    await testWithFileChooser(
        2,
        [
            "pddc",
            "allocation",
            "allocation",
            "nodecharacteristics",
            "repository",
            "resourceenvironment",
            "system",
            "usagemodel",
        ],
        true,
    );

    async function testWithFileChooser(childIndex: number, fileTypes: string[], multiple: boolean) {
        await openPalette(page);
        const [fileChooser] = await Promise.all([page.waitForEvent("filechooser"), select(page, 0, childIndex)]);
        await select(page, 0, 0);
        const acceptedTypes = (await fileChooser.element().getAttribute("accept")) ?? "";
        expect(fileChooser.isMultiple()).toBe(multiple);
        expect(acceptedTypes.split(",").length, `Found: ${acceptedTypes}, Expected: ${fileTypes.join(", ")}`).toBe(
            fileTypes.length,
        );
        for (const fileType of fileTypes) {
            expect(acceptedTypes).toContain(fileType);
        }
        fileChooser.setFiles([]);
    }
});

test("Test save", async ({ page, browserName }) => {
    await init(page);
    await openPalette(page);

    const [jsonDownload] = await Promise.all([page.waitForEvent("download"), select(page, 1, 0)]);
    const jsonFileName = jsonDownload.suggestedFilename();
    expect(jsonFileName.endsWith(".json"), `Expected ${jsonFileName} to end with .json`).toBeTruthy();
    await jsonDownload.delete();

    // as webkit has issues downloading multiple files, we skip for now
    if (browserName === "webkit") {
        return;
    }

    // due to browser animations focusing the downloads section late, we need to wait for them to finish here
    await page.waitForTimeout(1000);
    await focus(page);
    await openPalette(page);

    const [dfdDownload, ddDownload] = await Promise.all([
        page.waitForEvent("download", (d) => d.suggestedFilename().includes("dataflowdiagram")),
        page.waitForEvent("download", (d) => d.suggestedFilename().includes("datadictionary")),
        select(page, 1, 1),
    ]);
    const dfdFileName = dfdDownload.suggestedFilename();
    const ddFileName = ddDownload.suggestedFilename();

    expect(
        dfdFileName.endsWith(".dataflowdiagram"),
        `Expected ${dfdFileName} to end with .dataflowdiagram`,
    ).toBeTruthy();
    expect(ddFileName.endsWith(".datadictionary"), `Expected ${ddFileName} to end with .datadictionary`).toBeTruthy();
    await dfdDownload.delete();
    await ddDownload.delete();
});

test("Test Fit to Screen", async ({ page }) => {
    await init(page);
    await openPalette(page);

    const initialZoom = await getZoom(page);
    const initialScreenshot = await takeGraphScreenshot(page);

    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(500);
    const postScrollZoom = await getZoom(page);
    expect(postScrollZoom).not.toBe(initialZoom);
    const postScrollScreenshot = await takeGraphScreenshot(page);
    expect(postScrollScreenshot).not.toEqual(initialScreenshot);

    await select(page, 4);
    await page.waitForTimeout(500);
    const postFitZoom = await getZoom(page);
    expect(postFitZoom).not.toBe(postScrollZoom);
    const postFitScreenshot = await takeGraphScreenshot(page);
    expect(postFitScreenshot).not.toEqual(postScrollScreenshot);
});

test("Test layout", async ({ page }) => {
    const ID = "#sprotty_4myuyr";
    await init(page);
    const previousScreenshots = [await takeGraphScreenshot(page)];
    const previousPositions = [await getPosition(page, ID)];

    // Lines
    await testLayout(0);
    // Wrapping Lines
    await testLayout(1);
    // Circles
    await testLayout(2);

    // test default which should be Lines
    await openPalette(page);
    await select(page, 4);
    await page.waitForTimeout(250);
    const newScreenshot = await takeGraphScreenshot(page);
    const newPosition = await getPosition(page, ID);
    expect(newPosition).toEqual(previousPositions[1]);
    expect(newScreenshot).not.toEqual(previousScreenshots);
    for (const i of [0, 2, 3]) {
        expect(newPosition).not.toEqual(previousPositions[i]);
        expect(newScreenshot).not.toEqual(previousScreenshots[i]);
    }

    async function testLayout(childIndex: number) {
        await openPalette(page);
        await select(page, 4, childIndex);
        await page.waitForTimeout(250);
        const newScreenshot = await takeGraphScreenshot(page);
        const newPosition = await getPosition(page, ID);
        for (const previousPosition of previousPositions) {
            expect(
                newPosition,
                `Expected (${newPosition.x},${newPosition.y}) not to be (${previousPosition.x},${previousPosition.y}) at ${childIndex}`,
            ).not.toEqual(previousPosition);
        }
        for (const previousScreenshot of previousScreenshots) {
            expect(newScreenshot, `Expected screenshot difference at ${childIndex}`).not.toEqual(previousScreenshot);
        }
        previousPositions.push(newPosition);
        previousScreenshots.push(newScreenshot);
    }
});

async function openPalette(page: Page) {
    await pressKey(page, "Control", "Space");
    await page.waitForSelector(COMMAND_PALETTE_ID, { state: "visible" });
}

async function select(page: Page, parentIndex: number, childIndex?: number) {
    // as we start with no selection we have to press down one extra time
    for (let i = 0; i < parentIndex + 1; i++) {
        await pressKey(page, "ArrowDown");
    }
    if (childIndex !== undefined) {
        await pressKey(page, "ArrowRight");
        for (let i = 0; i < childIndex; i++) {
            await pressKey(page, "ArrowDown");
        }
    }
    await page.waitForTimeout(250);
    await pressKey(page, "Enter");
}
