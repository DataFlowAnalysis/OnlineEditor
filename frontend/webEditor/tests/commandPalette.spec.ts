import test, { expect, Page } from "@playwright/test";
import { init, pressKey } from "./utils";

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
    await page.waitForTimeout(500);
    await pressKey(page, "Enter");
}
