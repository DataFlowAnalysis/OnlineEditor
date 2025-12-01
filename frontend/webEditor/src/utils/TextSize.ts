export function dynamicallySetInputSize(inputElement: HTMLInputElement): void {
    const displayText = inputElement.value || inputElement.placeholder;
    const { width } = calculateTextSize(displayText, window.getComputedStyle(inputElement).font);

    // Values have higher padding for the rounded border
    const widthPadding = inputElement.classList.contains("label-type-name") ? 2 : 8;
    const finalWidth = width + widthPadding;

    inputElement.style.width = finalWidth + "px";
}

interface TextSize {
    width: number;
    height: number;
}

const contextMap = new Map<string, { context: CanvasRenderingContext2D; cache: Map<string, TextSize> }>();

export function calculateTextSize(text: string | undefined, font: string = "11pt sans-serif"): TextSize {
    if (!text || text.length === 0) {
        return { width: 20, height: 20 };
    }
    if (font == "") {
        font = "11pt sans-serif";
    }

    // Get context for the given font or create a new one if it does not exist yet
    let contextObj = contextMap.get(font);
    if (!contextObj) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not create canvas context used to measure text width");
        }

        context.font = font; // This is slow. Thats why we have one instance per font to avoid redoing this
        contextObj = { context, cache: new Map() };
        contextMap.set(font, contextObj);
    }

    const { context, cache } = contextObj;

    // Get text width from cache or compute it
    const cachedMetrics = cache.get(text);
    if (cachedMetrics) {
        return cachedMetrics;
    } else {
        const metrics = context.measureText(text);
        const textSize: TextSize = {
            width: Math.ceil(metrics.width),
            height: Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent),
        };

        cache.set(text, textSize);
        return textSize;
    }
}
