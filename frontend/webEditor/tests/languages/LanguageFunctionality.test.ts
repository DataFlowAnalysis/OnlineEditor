/*
Tests whether the functions verify, complete and replace to what they are supposed to with a simple custom language:

root
 ├── circle1 <─────────┐
 │      └── circle2* ──┘
 │
 └──> child
        ├──> !child1
        │      └──> any ──┐
        │                 ├──> child3,... ──> child4
        └──> child2* ─────┘

* = can be end state
! is optional for negation
,... is a list with the same word
*/
import { ReplacementData } from "../../src/languages/replace";
import { LanguageTreeNode } from "../../src/languages/tokenize";
import { AnyWord, ConstantWord, ListWord, NegatableWord, Word } from "../../src/languages/words";
import {
    AutoCompleteTestData,
    generateTests,
    InvalidExpressionTestData,
    ReplacementTestData,
} from "./LanguageTestUtils";

const VALID_EXPRESSIONS = [
    ["root circle1 circle2"],
    ["root", "circle1", "circle2"],
    ["root", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 circle2"],
    ["root", "circle1 circle2", "    circle1 circle2", "\tcircle1 circle2", "circle1 circle2", "circle1 circle2"],
    ["root child", "child1 bla child3 child4"],
    ["root child", "!child1 blab child3 child4"],
    ["root child child2"],
    ["root child child2 child3 child4"],
    ["root child child2 child3,child3 child4"],
    ["root child child2 child3,child3,child3 child4"],
];
const INVALID_EXPRESSIONS: InvalidExpressionTestData[] = [
    { input: ["root"] },
    { input: ["root circle1 circle2 circle1"] },
    { input: ["root WRONG child2"], output: [{ line: 1, startColumn: 6, endColumn: 11 }] },
    {
        input: ["root", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 circle2", "WRONG circle2"],
        output: [{ line: 6, startColumn: 1, endColumn: 6 }],
    },
    { input: ["root child child2 child3,child3, child4"] },
];
const AUTOCOMPLETE_TEST_DATA: AutoCompleteTestData[] = [
    { input: ["root "], completionOptions: ["circle1", "child"], exactOptionCount: true },
    {
        input: ["root", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 "],
        completionOptions: ["circle2"],
    },
    { input: ["root child !"], completionOptions: ["child1"] },
    { input: ["root child child2 child3,child3,child3 child4 "], completionOptions: [], exactOptionCount: true },
];
const simpleInput1 = ["root child child1 bla child3 child4"];
const simpleInput2 = ["root circle1 circle2 circle1 circle2"];
const REPLACEMENT_TEST_DATA: ReplacementTestData[] = [
    {
        input: ["root child child1 bla child3 child4"],
        output: ["root child child1 blub child3 child4"],
        replacement: { old: "bla", replacement: "blub", type: "replaceAny" },
    },
    {
        input: ["root child child1 bla child3 chil"],
        output: ["root child child1 blub child3 chil"],
        replacement: { old: "bla", replacement: "blub", type: "replaceAny" },
    },
    // check that no wrong replacements happen
    { input: simpleInput1, output: simpleInput1, replacement: { old: "blub", replacement: "bla", type: "replaceAny" } },
    { input: simpleInput1, output: simpleInput1, replacement: { old: "bla", replacement: "blub", type: "WRONG" } },
    {
        input: simpleInput2,
        output: simpleInput2,
        replacement: { old: "circle1", replacement: "circle2", type: "replaceAny" },
    },
];

const circleNode1: LanguageTreeNode<Word> = {
    word: new ConstantWord("circle1"),
    children: [],
};
const circleNode2: LanguageTreeNode<Word> = {
    word: new ConstantWord("circle2"),
    children: [circleNode1],
    canBeFinal: true,
};
circleNode1.children.push(circleNode2);

const child4: LanguageTreeNode<Word> = {
    word: new ConstantWord("child4"),
    children: [],
};
const child3: LanguageTreeNode<Word> = {
    word: new ListWord(new ConstantWord("child3")),
    children: [child4],
};
const child2: LanguageTreeNode<Word> = {
    word: new ConstantWord("child2"),
    children: [child3],
    canBeFinal: true,
};
class ReplaceAnyWord extends AnyWord {
    replace(text: string, replacement: ReplacementData): string {
        if (replacement.type === "replaceAny" && text === replacement.old) {
            return replacement.replacement;
        }
        return text;
    }
}
const anyChild: LanguageTreeNode<Word> = {
    word: new ReplaceAnyWord(),
    children: [child3],
};
const child1: LanguageTreeNode<Word> = {
    word: new NegatableWord(new ConstantWord("child1")),
    children: [anyChild],
};
const child: LanguageTreeNode<Word> = {
    word: new ConstantWord("child"),
    children: [child1, child2],
};

const root: LanguageTreeNode<Word> = {
    word: new ConstantWord("root"),
    children: [circleNode1, child],
};

generateTests(
    "Functionality Test Language",
    [root],
    VALID_EXPRESSIONS,
    INVALID_EXPRESSIONS,
    AUTOCOMPLETE_TEST_DATA,
    REPLACEMENT_TEST_DATA,
);
