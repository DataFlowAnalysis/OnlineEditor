export interface Token {
    text: string;
    line: number;
    column: number;
    whiteSpaceAfter?: string;
}

export interface LanguageTreeNode<W> {
    word: W;
    children: LanguageTreeNode<W>[];
    canBeFinal?: boolean;
    viewAsLeaf?: boolean;
}

export function tokenize(text: string[]): Token[] {
    if (!text || text.length == 0) {
        return [];
    }

    const tokens: Token[] = [];
    for (const [lineNumber, line] of text.entries()) {
        const lineTokens = line.split(/(\s+)/);
        let column = 0;
        for (let i = 0; i < lineTokens.length; i ++) {
            const token = lineTokens[i];
            if (!token.match(/\s+/) && token.length > 0) {
                tokens.push({
                    text: token,
                    line: lineNumber + 1,
                    column: column + 1,
                });
            }
            column += token.length;
        }
        if (line.match(/\s$/) || line.length == 0) {
            tokens.push({
                text: "",
                line: lineNumber + 1,
                column: column + 1
            })
        }
    }


    return tokens;
}
