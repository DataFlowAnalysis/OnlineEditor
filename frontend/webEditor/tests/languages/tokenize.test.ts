import { expect, it } from "vitest";
import { Token, tokenize } from "../../src/languages/tokenize";
import { joinLines } from "./LanguageTestUtils";

it("Tokenization", () => {
    for (const testSet of TEST_DATA) {
        const result = tokenize(testSet.input);
        expect(result.length, `Unexpected Token length for input "${joinLines(testSet.input)}"`).toBe(
            testSet.expected.length,
        );
        for (let i = 0; i < testSet.expected.length; i++) {
            const keysToTest = Object.keys(testSet.expected[i]) as (keyof Token)[];
            for (const key of keysToTest) {
                expect
                    .soft(
                        result[i][key],
                        `Property of token ${i} with key "${key}" for input "${joinLines(testSet.input)}" did not match`,
                    )
                    .toBe(testSet.expected[i][key]);
            }
        }
    }
});

const TEST_DATA: TokenizationTestData[] = [
    {
        input: ["Hello World"],
        expected: [
            { line: 1, column: 1, text: "Hello" },
            { line: 1, column: 7, text: "World" },
        ],
    },
    {
        input: ["Long     Gap"],
        expected: [{ column: 1 }, { column: 10 }],
    },
    {
        input: ["Multi", "Line"],
        expected: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
        ],
    },
    {
        input: ["Gap at", "    line start"],
        expected: [{ line: 1, column: 1 }, { line: 1 }, { line: 2, column: 5 }, { line: 2, column: 10 }],
    },
];

interface TokenizationTestData {
    input: string[];
    /** For each token you only need to give the parameters you want to test for (e.g. only correct line). If you just test for the token being present an empty object can be given. */
    expected: Partial<Token>[];
}
