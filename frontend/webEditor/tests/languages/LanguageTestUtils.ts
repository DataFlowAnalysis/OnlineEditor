import { expect, it } from "vitest";
import { verify, VerifyWord } from "../../src/languages/verify";
import { complete, CompletionWord } from "../../src/languages/autocomplete";
import { replace, ReplaceableWord, ReplacementData } from "../../src/languages/replace";
import { LanguageTreeNode, tokenize } from "../../src/languages/tokenize";

export function generateTests(
    name: string,
    tree: LanguageTreeNode<VerifyWord & CompletionWord & ReplaceableWord>[],
    validExpressions: ValidExpressionTestData[],
    invalidExpressions: InvalidExpressionTestData[],
    autoCompleteTests: AutoCompleteTestData[],
    replacementTests: ReplacementTestData[],
) {
    for (let i = 0; i < validExpressions.length; i++) {
        it(`${name} Valid Expression ${i}`, () => {
            const tokens = tokenize(validExpressions[i]);
            const result = verify(tokens, tree);
            expect(
                result.length,
                `Valid Expression ${joinLines(validExpressions[i])} had Errors: ${result.map((v) => JSON.stringify(v)).join("\n")}`,
            ).toBe(0);
        });
    }

    for (let i = 0; i < invalidExpressions.length; i++) {
        it(`${name} Invalid Expression ${i}`, () => {
            const tokens = tokenize(invalidExpressions[i].input);
            const result = verify(tokens, tree);
            expect(
                result.length,
                `Invalid Expression ${joinLines(invalidExpressions[i].input)} had no Errors`,
            ).toBeGreaterThan(0);
            if (invalidExpressions[i].output !== undefined) {
                for (const expectedError of invalidExpressions[i].output!) {
                    expect
                        .soft(
                            result.find(
                                (e) =>
                                    e.line === expectedError.line &&
                                    e.startColumn === expectedError.startColumn &&
                                    (expectedError.endColumn === undefined || e.endColumn === expectedError.endColumn),
                            ),
                            `Could not find Error at ${JSON.stringify(expectedError)} in ${joinLines(invalidExpressions[i].input)}`,
                        )
                        .toBeDefined();
                }
            }
        });
    }

    for (let i = 0; i < autoCompleteTests.length; i++) {
        it(`${name} Autocomplete ${i}`, () => {
            const tokens = tokenize(autoCompleteTests[i].input);
            const result = complete(tokens, tree);
            const completionStrings = result.map((r) => r.insertText);
            if (autoCompleteTests[i].exactOptionCount === true) {
                expect.soft(result.length).toBe(autoCompleteTests[i].completionOptions.length);
            }
            for (const option of autoCompleteTests[i].completionOptions) {
                expect
                    .soft(
                        completionStrings.includes(option),
                        `Autocompletion for ${joinLines(autoCompleteTests[i].input)} did not provide option ${option}`,
                    )
                    .toBeTruthy();
            }
        });
    }

    for (let i = 0; i < replacementTests.length; i++) {
        it(`${name} Replacement ${i}`, () => {
            const result = replace(replacementTests[i].input, tree, replacementTests[i].replacement);
            expect(
                result.length,
                `Replacement ${replacementTests[i].replacement} resulted in wrong length for ${joinLines(replacementTests[i].input)}`,
            ).toEqual(replacementTests[i].output.length);
            for (let l = 0; l < result.length; l++) {
                expect
                    .soft(
                        result[l],
                        `Line ${l + 1} did not match after replacement ${replacementTests[i].replacement} for in ${joinLines(replacementTests[i].input)}`,
                    )
                    .toBe(replacementTests[i].output[l]);
            }
        });
    }
}

export type ValidExpressionTestData = string[];

export interface InvalidExpressionTestData {
    input: string[];
    output?: { line: number; startColumn: number; endColumn?: number }[];
}

export interface AutoCompleteTestData {
    input: string[];
    completionOptions: string[];
    // if set to true, checks that the number of options returned by the completer matches the length of completionOptions (default: false)
    exactOptionCount?: boolean;
}

export interface ReplacementTestData {
    input: string[];
    replacement: ReplacementData;
    output: string[];
}

export function joinLines(input: string[]) {
    return input.join("\\n");
}
