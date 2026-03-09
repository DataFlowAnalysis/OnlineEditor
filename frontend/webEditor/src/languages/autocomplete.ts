import { LanguageTreeNode, Token, tokenize } from "./tokenize";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { VerifyWord } from "./verify";

interface RequiredCompletionParts {
    kind: monaco.languages.CompletionItemKind;
    insertText: string;
    startOffset?: number;
}

export type WordCompletion = RequiredCompletionParts & Partial<monaco.languages.CompletionItem>;

export interface CompletionWord extends VerifyWord {
    completionOptions(currentWord: string): WordCompletion[];
}
type CompletionLanguageTreeNode = LanguageTreeNode<CompletionWord>;

export function complete(tokens: Token[], tree: CompletionLanguageTreeNode[]): monaco.languages.CompletionItem[] {
    return transformResults(completeNode(tokens, tree, 0, tree), tokens);
}

function completeNode(
    tokens: Token[],
    nodes: CompletionLanguageTreeNode[],
    index: number,
    roots: CompletionLanguageTreeNode[],
    cameFromFinal = false,
    skipStartCheck = false,
): WordCompletion[] {
    // check for new start
    if (!skipStartCheck && tokens[index].column == 1) {
        const matchesAnyRoot = roots.some((n) => n.word.verify(tokens[index].text).length === 0);
        if (matchesAnyRoot) {
            return completeNode(tokens, roots, index, roots, cameFromFinal, true);
        } else if (cameFromFinal || nodes.length == 0) {
            return completeNode(tokens, [...roots, ...nodes], index, roots, cameFromFinal, true);
        }
    }

    let result: WordCompletion[] = [];
    if (index == tokens.length - 1) {
        for (const node of nodes) {
            result = result.concat(node.word.completionOptions(tokens[index].text));
        }
        return result;
    }
    for (const n of nodes) {
        if (n.word.verify(tokens[index].text).length > 0) {
            continue;
        }
        result = result.concat(completeNode(tokens, n.children, index + 1, roots, n.canBeFinal || false));
    }
    return result;
}

function transformResults(comp: WordCompletion[], tokens: Token[]): monaco.languages.CompletionItem[] {
    const result: monaco.languages.CompletionItem[] = [];
    const filtered = comp.filter(
        (c, idx) => comp.findIndex((c2) => c2.insertText === c.insertText && c2.kind === c.kind) === idx,
    );
    for (const c of filtered) {
        const r = transformResult(c, tokens);
        result.push(r);
    }
    return result;
}

function transformResult(comp: WordCompletion, tokens: Token[]): monaco.languages.CompletionItem {
    const wordStart = tokens.length == 0 ? 1 : tokens[tokens.length - 1].column;
    const lineNumber = tokens.length == 0 ? 1 : tokens[tokens.length - 1].line;
    return {
        insertText: comp.insertText,
        kind: comp.kind,
        label: comp.label ?? comp.insertText,
        insertTextRules: comp.insertTextRules,
        range: new monaco.Range(
            lineNumber,
            wordStart + (comp.startOffset ?? 0),
            lineNumber,
            wordStart + (comp.startOffset ?? 0),
        ),
    };
}

export class DfdCompletionItemProvider implements monaco.languages.CompletionItemProvider {
    constructor(private tree: CompletionLanguageTreeNode[]) {}

    triggerCharacters = [".", "(", " ", ","];

    provideCompletionItems(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
    ): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
        const allLines = model.getLinesContent();
        const includedLines: string[] = [];
        for (let i = 0; i < position.lineNumber - 1; i++) {
            includedLines.push(allLines[i]);
        }
        const currentLine = allLines[position.lineNumber - 1].substring(0, position.column - 1);
        includedLines.push(currentLine);

        const tokens = tokenize(includedLines);
        const r = complete(tokens, this.tree);
        return {
            suggestions: r,
        };
    }

    public setTree(tree: CompletionLanguageTreeNode[]) {
        this.tree = tree;
    }
}
