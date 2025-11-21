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
        for (let i = 0; i < lineTokens.length; i += 2) {
            const token = lineTokens[i];
            if (token.length > 0) {
                tokens.push({
                    text: token,
                    line: lineNumber + 1,
                    column: column + 1,
                    whiteSpaceAfter: lineTokens[i + 1],
                });
            }
            column += token.length;
            column += lineTokens[i + 1] ? lineTokens[i + 1].length : 0; // Add whitespace length
        }
        if (lineTokens.length % 2 == 1) {
            tokens.push({
                text: "",
                line: lineNumber + 1,
                column
            })
        }
    }


    return tokens;
}
