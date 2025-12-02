import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { LanguageTreeNode } from "../languages/tokenize";
import { ConstantWord, ListWord, Word } from "../languages/words";
import { DfdNodeImpl } from "../diagram/nodes/common";
import { WordCompletion } from "../languages/autocomplete";

export const ASSIGNMENT_LANGUAGE_ID = "dfd-assignment-language";

const startOfLineKeywords = ["forward", "assign", "set", "unset"];
const statementKeywords = [...startOfLineKeywords, "if", "from"];
const constantsKeywords = ["TRUE", "FALSE"];
export const assignmentLanguageMonarchDefinition: monaco.languages.IMonarchLanguage = {
    keywords: [...statementKeywords, ...constantsKeywords],

    operators: ["=", "||", "&&", "!"],

    symbols: /[=><!~?:&|+\-*/^%]+/,

    tokenizer: {
        root: [
            // keywords and identifiers
            [
                /[a-zA-Z_|$][\w$]*/,
                {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "identifier",
                    },
                },
            ],

            // whitespace and comments
            [/[ \t\r\n]+/, "white"],
            [/\/\/.*$/, "comment"],
            [/#.*$/, "comment"],

            [
                /@symbols/,
                {
                    cases: {
                        "@operators": "operator",
                        "@default": "",
                    },
                },
            ],
        ],
    },
};

export namespace AssignmentLanguageTreeBuilder {
    export function buildTree(port: DfdOutputPortImpl, labelTypeRegistry: LabelTypeRegistry): LanguageTreeNode<Word>[] {
        return [
            buildSetOrUnsetStatement(labelTypeRegistry, "set"),
            buildSetOrUnsetStatement(labelTypeRegistry, "unset"),
            buildForwardStatement(port),
            buildAssignStatement(labelTypeRegistry, port),
        ];
    }

    function buildSetOrUnsetStatement(labelTypeRegistry: LabelTypeRegistry, keyword: string): LanguageTreeNode<Word> {
        const labelNode: LanguageTreeNode<Word> = {
            word: new ListWord(new LabelWord(labelTypeRegistry)),
            children: [],
        };
        return {
            word: new ConstantWord(keyword),
            children: [labelNode],
        };
    }

    function buildForwardStatement(port: DfdOutputPortImpl): LanguageTreeNode<Word> {
        const inputNode: LanguageTreeNode<Word> = {
            word: new ListWord(new InputWord(port)),
            children: [],
        };
        return {
            word: new ConstantWord("forward"),
            children: [inputNode],
        };
    }

    function buildAssignStatement(
        labelTypeRegistry: LabelTypeRegistry,
        port: DfdOutputPortImpl,
    ): LanguageTreeNode<Word> {
        const fromNode: LanguageTreeNode<Word> = {
            word: new ConstantWord("from"),
            children: [
                {
                    word: new ListWord(new InputWord(port)),
                    children: [],
                },
            ],
        };
        const ifNode: LanguageTreeNode<Word> = {
            word: new ConstantWord("if"),
            children: buildCondition(labelTypeRegistry, fromNode, port),
        };
        return {
            word: new ConstantWord("assign"),
            children: [
                {
                    word: new LabelWord(labelTypeRegistry),
                    children: [ifNode],
                },
            ],
        };
    }

    function buildCondition(
        labelTypeRegistry: LabelTypeRegistry,
        nextNode: LanguageTreeNode<Word>,
        port: DfdOutputPortImpl,
    ) {
        const connectors: LanguageTreeNode<Word>[] = ["&&", "||"].map((o) => ({
            word: new ConstantWord(o),
            children: [],
        }));

        const expressors: LanguageTreeNode<Word>[] = [
            new ConstantWord("TRUE"),
            new ConstantWord("FALSE"),
            new InputLabelWord(labelTypeRegistry, port),
        ].map((e) => ({
            word: e,
            children: [...connectors, nextNode],
            canBeFinal: true,
        }));

        connectors.forEach((c) => {
            c.children = expressors;
        });
        return expressors;
    }
}

abstract class InputAwareWord {
    constructor(private port: DfdOutputPortImpl) {}

    protected getAvailableInputs(): string[] {
        const parent = this.port.parent;
        if (parent instanceof DfdNodeImpl) {
            return parent.getAvailableInputs().filter((input) => input !== undefined) as string[];
        }
        return [];
    }
}

class LabelWord implements Word {
    constructor(private readonly labelTypeRegistry: LabelTypeRegistry) {}

    completionOptions(word: string): WordCompletion[] {
        const parts = word.split(".");

        if (parts.length == 1) {
            return this.labelTypeRegistry.getLabelTypes().map((l) => ({
                insertText: l.name,
                kind: monaco.languages.CompletionItemKind.Class,
            }));
        } else if (parts.length == 2) {
            const type = this.labelTypeRegistry.getLabelTypes().find((l) => l.name === parts[0]);
            if (!type) {
                return [];
            }

            return type.values.map((l) => ({
                insertText: l.text,
                kind: monaco.languages.CompletionItemKind.Enum,
                startOffset: parts[0].length + 1,
            }));
        }

        return [];
    }

    verify(word: string): string[] {
        const parts = word.split(".");

        if (parts.length > 2) {
            return ["Expected at most 2 parts in characteristic selector"];
        }

        const type = this.labelTypeRegistry.getLabelTypes().find((l) => l.name === parts[0]);
        if (!type) {
            return ['Unknown label type "' + parts[0] + '"'];
        }

        if (parts.length < 2) {
            return ["Expected characteristic to have value"];
        }

        if (parts[1].startsWith("$") && parts[1].length >= 2) {
            return [];
        }

        const label = type.values.find((l) => l.text === parts[1]);
        if (!label) {
            return ['Unknown label value "' + parts[1] + '" for type "' + parts[0] + '"'];
        }

        return [];
    }
    /*
    replaceWord(text: string, replacement: ReplacementData) {
        if (replacement.type == "Label" && text == replacement.old) {
            return replacement.replacement;
        }
        return text;
    }*/
}

class InputWord extends InputAwareWord implements Word {
    completionOptions(): WordCompletion[] {
        const inputs = this.getAvailableInputs();
        return inputs.map((input) => ({
            insertText: input,
            kind: monaco.languages.CompletionItemKind.Variable,
        }));
    }

    verify(word: string): string[] {
        const availableInputs = this.getAvailableInputs();
        if (availableInputs.includes(word)) {
            return [];
        }
        return [`Unknown input "${word}"`];
    }

    /*replaceWord(text: string, replacement: ReplacementData) {
        if (replacement.type == "Input" && text == replacement.old) {
            return replacement.replacement;
        }
        return text;
    }*/
}

class InputLabelWord implements Word {
    private inputWord: InputWord;
    private labelWord: LabelWord;

    constructor(labelTypeRegistry: LabelTypeRegistry, port: DfdOutputPortImpl) {
        this.inputWord = new InputWord(port);
        this.labelWord = new LabelWord(labelTypeRegistry);
    }

    completionOptions(word: string): WordCompletion[] {
        const parts = this.getParts(word);
        if (parts[1] === undefined) {
            return this.inputWord.completionOptions().map((c) => ({
                ...c,
                insertText: c.insertText,
            }));
        } else if (parts.length >= 2) {
            return this.labelWord.completionOptions(parts[1]).map((c) => ({
                ...c,
                insertText: c.insertText,
                startOffset: (c.startOffset ?? 0) + parts[0].length + 1, // +1 for the dot
            }));
        }
        return [];
    }

    verify(word: string): string[] {
        const parts = this.getParts(word);
        const inputErrors = this.inputWord.verify(parts[0]);
        if (inputErrors.length > 0) {
            return inputErrors;
        }
        if (parts[1] === undefined) {
            return ["Expected input and label separated by a dot"];
        }
        const labelErrors = this.labelWord.verify(parts[1]);
        return [...inputErrors, ...labelErrors];
    }

    /*replaceWord(text: string, replacement: ReplacementData) {
        const [input, label] = this.getParts(text);
        if (replacement.type == "Input" && input === replacement.old) {
            return replacement.replacement + (label ? "." + label : "");
        } else if (replacement.type == "Label" && label === replacement.old) {
            return input + "." + replacement.replacement;
        }
        return text;
    }*/

    private getParts(text: string): [string, string] | [string, undefined] {
        if (text.includes(".")) {
            const index = text.indexOf(".");
            const input = text.substring(0, index);
            const label = text.substring(index + 1);
            return [input, label];
        }
        return [text, undefined];
    }
}
