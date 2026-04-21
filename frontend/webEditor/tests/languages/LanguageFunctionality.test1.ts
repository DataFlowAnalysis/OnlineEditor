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
import { generateTests } from "./LanguageTestUtils";

const VALID_EXPRESSIONS = [
    ["root circle1 circle2"],
    ["root", "circle1", "circle2"],
    ["root", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 circle2", "circle1 circle2"],
    ["root child", "child1 bla child3 child4"],
    ["root child", "!child1 bla child3 child4"],
    ["root child child2"],
    ["root child child2 child3 child4"],
    ["root child child2 child3,child3 child4"],
    ["root child child2 child3,child3,child3 child4"],
];

type N = LanguageTreeNode<Word>;

const circleNode1: N = {
    word: new ConstantWord("circle1"),
    children: [],
};
const circleNode2: N = {
    word: new ConstantWord("circle2"),
    children: [circleNode1],
    canBeFinal: true,
};
circleNode1.children.push(circleNode2);

const child4: N = {
    word: new ConstantWord("child3"),
    children: [],
};
const child3: N = {
    word: new ListWord(new ConstantWord("child3")),
    children: [child4],
};
const child2: N = {
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
const anyChild: N = {
    word: new ReplaceAnyWord(),
    children: [child3],
};
const child1: N = {
    word: new NegatableWord(new ConstantWord("child1")),
    children: [anyChild],
};
const child: N = {
    word: new ConstantWord("child"),
    children: [child1, child2],
};

const root: N = {
    word: new ConstantWord("root"),
    children: [circleNode1, child],
};

generateTests("Functionality Test Language", [root], VALID_EXPRESSIONS, [], [], []);
