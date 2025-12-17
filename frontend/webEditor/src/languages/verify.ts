import { LanguageTreeNode, Token } from "./tokenize";

export interface ValidationError {
    message: string;
    line: number;
    startColumn: number;
    endColumn: number;
}

export interface VerifyWord {
    verify: (word: string) => string[];
}
type VerifyLanguageTreeNode = LanguageTreeNode<VerifyWord>;

export function verify(tokens: Token[], tree: VerifyLanguageTreeNode[]): ValidationError[] {
    return verifyNode(tokens, tree, 0, false, tree, true);
}

function verifyNode(
    tokens: Token[],
    nodes: VerifyLanguageTreeNode[],
    index: number,
    comesFromFinal: boolean,
    roots: VerifyLanguageTreeNode[],
    skipStartCheck = false,
): ValidationError[] {
    if (index >= tokens.length) {
        if (nodes.length == 0 || comesFromFinal) {
            return [];
        } else {
            return [
                {
                    message: "Unexpected end of line",
                    line: tokens[index - 1].line,
                    startColumn: tokens[index - 1].column + tokens[index - 1].text.length - 1,
                    endColumn: tokens[index - 1].column + tokens[index - 1].text.length,
                },
            ];
        }
    }
    if (!skipStartCheck && tokens[index].column == 1) {
        const matchesAnyRoot = roots.some((r) => r.word.verify(tokens[index].text).length === 0);
        if (matchesAnyRoot) {
            return verifyNode(tokens, roots, index, false, roots, true);
        }
    }

    const foundErrors: ValidationError[] = [];
    let childErrors: ValidationError[] = [];
    for (const n of nodes) {
        const v = n.word.verify(tokens[index].text);
        if (v.length > 0) {
            foundErrors.push({
                message: v[0],
                startColumn: tokens[index].column,
                endColumn: tokens[index].column + tokens[index].text.length,
                line: tokens[index].line,
            });
            continue;
        }

        const childResult = verifyNode(tokens, n.children, index + 1, n.canBeFinal || false, roots);
        if (childResult.length == 0) {
            return [];
        } else {
            childErrors = childErrors.concat(childResult);
        }
    }
    if (childErrors.length > 0) {
        return deduplicateErrors(childErrors);
    }
    return deduplicateErrors(foundErrors);
}

function deduplicateErrors(errors: ValidationError[]): ValidationError[] {
    const seen = new Set<string>();
    return errors.filter((error) => {
        const key = `${error.line}-${error.startColumn}-${error.endColumn}-${error.message}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
