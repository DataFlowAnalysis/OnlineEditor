import { CompletionWord, WordCompletion } from "./autocomplete";
import { VerifyWord } from "./verify";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export type Word = VerifyWord & CompletionWord;

export class ConstantWord implements Word {
    constructor(private readonly word: string) {}

    verify(word: string) {
        if (word === this.word) {
            return [];
        } else {
            return [`Expected keyword "${this.word}"`];
        }
    }
    completionOptions(): WordCompletion[] {
        return [
            {
                insertText: this.word,
                kind: monaco.languages.CompletionItemKind.Keyword,
            },
        ];
    }
}

export class AnyWord implements Word {
    verify(word: string): string[] {
        if (word.length > 0) {
            return [];
        } else {
            return ["Expected a symbol"];
        }
    }
    completionOptions(): WordCompletion[] {
        return [];
    }
}

export class NegatableWord implements Word {
    constructor(protected word: Word) {}

    verify(word: string): string[] {
        if (word.startsWith("!")) {
            return this.word.verify(word.substring(1));
        }
        return this.word.verify(word);
    }

    completionOptions(part: string): WordCompletion[] {
        if (part.startsWith("!")) {
            const options = this.word.completionOptions(part.substring(1));
            return options.map((o) => ({
                ...o,
                startOffset: (o.startOffset ?? 0) + 1,
            }));
        }
        return this.word.completionOptions(part);
    }
}

export class ListWord implements Word {
    constructor(protected word: Word) {}

    verify(word: string): string[] {
        const parts = word.split(",");
        for (const part of parts) {
            const verify = this.word.verify(part);
            if (verify.length > 0) {
                return verify;
            }
        }
        return [];
    }
    completionOptions(word: string): WordCompletion[] {
        const parts = word.split(",");
        const last = parts[parts.length - 1];

        return this.word.completionOptions(last);
    }
}
