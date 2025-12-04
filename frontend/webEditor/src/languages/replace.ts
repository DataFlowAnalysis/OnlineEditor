import { LanguageTreeNode, Token, tokenize } from "./tokenize";
import { VerifyWord } from "./verify";

export interface ReplaceableWord {
    replace?: (text: string, replacement: ReplacementData) => string;
}

export interface ReplacementData {
    old: string;
    replacement: string;
    type: string;
}

export interface ReplacedToken extends Token {
    newText: string;
}

export function replace(
    lines: string[],
    tree: LanguageTreeNode<ReplaceableWord & VerifyWord>[],
    replacement: ReplacementData,
): string[] {
    const tokens = tokenize(lines);
    const replaced = replaceTokens(tokens, tree, tree, 0, replacement);
    for (let i = 0; i < tokens.length; i++) {
        replaceToken(i);
    }
    return lines;

    function replaceToken(index: number) {
        const token = replaced[index];
        const lengthDiff = token.newText.length - token.text.length;
        const lineIndex = token.line - 1;
        const line = lines[lineIndex];
        const before = line.substring(0, token.column - 1);
        const after = line.substring(token.column - 1 + token.text.length);
        lines[lineIndex] = before + token.newText + after;
        let i = index + 1;
        // adjust the column of all following tokens on the same line
        while (i < tokens.length && tokens[i].line == token.line) {
            replaced[i].column += lengthDiff;
            i++;
        }
    }
}

function replaceTokens(
    tokens: Token[],
    tree: LanguageTreeNode<ReplaceableWord & VerifyWord>[],
    roots: LanguageTreeNode<ReplaceableWord & VerifyWord>[],
    index: number,
    replacement: ReplacementData,
    skipStartCheck = false,
): ReplacedToken[] {
    if (index >= tokens.length) {
        return [];
    }
    // check for new start
    if (!skipStartCheck && tokens[index].column == 1) {
        const matchesAnyRoot = roots.some((n) => n.word.verify(tokens[index].text).length === 0);
        if (matchesAnyRoot) {
            return replaceTokens(tokens, roots, roots, index, replacement, true);
        }
    }
    let newText = tokens[index].text;
    for (const n of tree) {
        if (n.word.replace) {
            newText = n.word.replace(newText, replacement);
        }
    }
    return [
        {
            ...tokens[index],
            newText,
        },
        ...replaceTokens(
            tokens,
            tree.flatMap((n) => n.children),
            roots,
            index + 1,
            replacement,
        ),
    ];
}
