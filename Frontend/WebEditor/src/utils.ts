/**
 * Type identifiers for use with inversify.
 */
export const EDITOR_TYPES = {
    // Enableable and disableable tools that can be used to e.g. create new elements.
    DfdTool: Symbol("DfdTool"),
    // All IUIExtension instances that are bound to this symbol will
    // be loaded and enabled at editor startup.
    DefaultUIElement: Symbol("DefaultUIElement"),
};

export const FIT_TO_SCREEN_PADDING = 75;

export function generateRandomSprottyId(): string {
    return Math.random().toString(36).substring(7);
}

const contextMap = new Map<string, { context: CanvasRenderingContext2D; cache: Map<string, number> }>();

/**
 * Calculates the width of the given text in the given font using a 2d canvas.
 * Because this operation requires interacting with the browser including styling etc.
 * this is rather expensive. Therefore the result is cached with the font and text as a cache key
 * The default width for empty text is 20px.
 * Big diagrams with hundereds of text elements (edges, nodes, labels) would not be possible without caching this operation.
 *
 * @param text the text you need the width for
 * @param font the font to use, defaults to "11pt sans-serif"
 * @returns the width of the text in pixels. This does not include any padding or margin
 */
export function calculateTextWidth(text: string | undefined, font: string = "11pt sans-serif"): number {
    if (!text || text.length === 0) {
        return 20;
    }

    // Get context for the given font or create a new one if it does not exist yet
    if (!contextMap.has(font)) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not create canvas context used to measure text width");
        }

        context.font = font; // This is slow. Thats why we have one instance per font to avoid redoing this
        contextMap.set(font, { context, cache: new Map<string, number>() });
    }

    const { context, cache } = contextMap.get(font)!;

    // Get text width from cache or compute it
    const cachedWidth = cache.get(text);
    if (cachedWidth) {
        return cachedWidth;
    } else {
        const metrics = context.measureText(text);
        const width = Math.round(metrics.width);
        cache.set(text, width);
        return width;
    }
}
