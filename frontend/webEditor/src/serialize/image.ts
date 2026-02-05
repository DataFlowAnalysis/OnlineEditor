import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    IVNodePostprocessor,
    ModelRenderer,
    TYPES,
    ViewRegistry,
} from "sprotty";
import themeCss from "../assets/theme.css?raw";
import elementCss from "../diagram/style.css?raw";
import toHTML from "snabbdom-to-html";
import { classModule, eventListenersModule, h, init, propsModule, styleModule, VNode, VNodeStyle } from "snabbdom";
import { Action } from "sprotty-protocol";
import { inject, multiInject } from "inversify";
import { FileName } from "../fileName/fileName";

const patch = init([
    // Init patch function with chosen modules
    classModule, // makes it easy to toggle classes
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
]);

export namespace SaveImageAction {
    export const KIND = "save-image";

    export function create(): Action {
        return {
            kind: KIND,
        };
    }
}

export class SaveImageCommand extends Command {
    static readonly KIND = SaveImageAction.KIND;
    private static readonly PADDING = 5;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(FileName) private readonly fileName: FileName,
        @inject(TYPES.ViewRegistry) private readonly viewRegistry: ViewRegistry,
        @multiInject(TYPES.IVNodePostprocessor) private readonly postProcessors: IVNodePostprocessor[],
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const dummyRoot = document.createElement("div");
        dummyRoot.style.position = "absolute";
        dummyRoot.style.left = "-100000px";
        dummyRoot.style.top = "-100000px";
        dummyRoot.style.visibility = "hidden";

        document.body.appendChild(dummyRoot);
        try {
            this.makeImage(context, dummyRoot);
        } finally {
            document.body.removeChild(dummyRoot);
        }

        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    makeImage(context: CommandExecutionContext, dom: HTMLElement) {
        // render diagram virtually
        const renderer = new ModelRenderer(this.viewRegistry, "hidden", this.postProcessors);
        const svg = renderer.renderElement(context.root);
        if (!svg) return;

        // add stylesheets
        const styleHolder = document.createElement("style");
        styleHolder.innerHTML = `${themeCss}\n${elementCss}`;
        dom.appendChild(styleHolder);

        // render svg into dom
        const dummyDom = h("div", {}, [svg]);
        patch(dom, dummyDom);
        // apply style and clean attributes
        transformStyleToAttributes(dummyDom);
        removeUnusedAttributes(dummyDom);

        // compute diagram offset and size
        const holderG = svg.children?.[0];
        if (!holderG || typeof holderG == "string") return;
        const actualElements = holderG.children ?? [];
        const minTranslate = { x: Infinity, y: Infinity };
        const maxSize = { x: 0, y: 0 };
        for (const child of actualElements) {
            if (typeof child == "string") continue;
            const childTranslate = this.getMinTranslate(child);
            minTranslate.x = Math.min(minTranslate.x, childTranslate.x);
            minTranslate.y = Math.min(minTranslate.y, childTranslate.y);

            const childSize = this.getMaxRequieredCanvasSize(child);
            maxSize.x = Math.max(maxSize.x, childSize.x);
            maxSize.y = Math.max(maxSize.y, childSize.y);
        }

        // correct offset and set size
        if (!holderG.data) holderG.data = {};
        if (!holderG.data.attrs) holderG.data.attrs = {};
        holderG.data.attrs["transform"] =
            `translate(${-minTranslate.x + SaveImageCommand.PADDING},${-minTranslate.y + SaveImageCommand.PADDING})`;
        if (!svg.data) svg.data = {};
        if (!svg.data.attrs) svg.data.attrs = {};
        const width = maxSize.x - minTranslate.x + 2 * SaveImageCommand.PADDING;
        const height = maxSize.y - minTranslate.y + 2 * SaveImageCommand.PADDING;
        svg.data.attrs.width = width;
        svg.data.attrs.height = height;
        svg.data.attrs.viewBox = `0 0 ${width} ${height}`;

        // make sure element is seen as svg by all users
        svg.data.attrs.version = "1.0";
        svg.data.attrs.xmlns = "http://www.w3.org/2000/svg";

        // download file
        const blob = new Blob([toHTML(svg)], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = this.fileName.getName() + ".svg";
        link.click();
    }

    /**
     * Gets the minimum translation of an element relative to the svg.
     * This is done by recursively getting the translation of all child elements
     * @param e the element to get the translation from
     * @param parentOffset Offset of the containing element
     * @returns Minimum absolute offset of any child element relative to the svg
     */
    private getMinTranslate(
        e: VNode,
        parentOffset: { x: number; y: number } = { x: 0, y: 0 },
    ): { x: number; y: number } {
        const myTranslate = this.getTranslate(e, parentOffset);
        const minTranslate = myTranslate ?? { x: Infinity, y: Infinity };

        const children = e.children ?? [];
        for (const child of children) {
            if (typeof child == "string") continue;
            const childTranslate = this.getMinTranslate(child, myTranslate);
            minTranslate.x = Math.min(minTranslate.x, childTranslate.x);
            minTranslate.y = Math.min(minTranslate.y, childTranslate.y);
        }
        return minTranslate;
    }

    /**
     * Calculates the absolute translation of an element relative to the svg.
     * If the element has no translation, the offset of the parent is returned.
     * @param e the element to get the translation from
     * @param parentOffset Offset of the containing element
     * @returns Offset of the child relative to the svg
     */
    private getTranslate(
        e: VNode,
        parentOffset: { x: number; y: number } = { x: 0, y: 0 },
    ): { x: number; y: number } | undefined {
        const transform = e.data?.attrs?.["transform"] as string | undefined;
        if (!transform) return undefined;
        const translateMatch = transform.match(/translate\(([^)]+)\)/);
        if (!translateMatch) return parentOffset;
        const translate = translateMatch[1].match(/(-?[0-9.]+)(?:, | |,)(-?[0-9.]+)/);
        if (!translate) return parentOffset;
        const x = parseFloat(translate[1]);
        const y = parseFloat(translate[2]);
        const newX = x + parentOffset.x;
        const newY = y + parentOffset.y;
        return { x: newX, y: newY };
    }

    private getMaxRequieredCanvasSize(
        e: VNode,
        parentOffset: { x: number; y: number } = { x: 0, y: 0 },
    ): { x: number; y: number } {
        const myTranslate = this.getTranslate(e, parentOffset);
        const maxSize = this.getRequieredCanvasSize(e, parentOffset);

        const children = e.children ?? [];
        for (const child of children) {
            if (typeof child == "string") continue;
            const childTranslate = this.getMaxRequieredCanvasSize(child, myTranslate);
            maxSize.x = Math.max(maxSize.x, childTranslate.x);
            maxSize.y = Math.max(maxSize.y, childTranslate.y);
        }
        return maxSize;
    }

    private getRequieredCanvasSize(
        e: VNode,
        parentOffset: { x: number; y: number } = { x: 0, y: 0 },
    ): { x: number; y: number } {
        const width = (e.data?.attrs?.["width"] as number | undefined) ?? 0;
        const height = (e.data?.attrs?.["height"] as number | undefined) ?? 0;
        const translate = this.getTranslate(e, parentOffset) ?? parentOffset;

        const x = translate.x + width;
        const y = translate.y + height;
        return { x: x, y: y };
    }
}

function transformStyleToAttributes(v: VNode) {
    if (!v.elm) return;

    if (!v.data) v.data = {};
    if (!v.data.style) v.data.style = {};
    if (!v.data.attrs) v.data.attrs = {};

    const computedStyle = getComputedStyle(v.elm as Element) as VNodeStyle;
    for (const key of getRelevantStyleProps(v)) {
        let value = v.data.style[key] ?? computedStyle[key];
        if (key == "fill" && value.startsWith("color(srgb")) {
            const srgb = /color\(srgb ([^ ]+) ([^ ]+) ([^ ]+)(?: ?\/ ?([^ ]+))?\)/.exec(value);
            if (srgb) {
                const r = Math.round(Number(srgb[1]) * 255);
                const g = Math.round(Number(srgb[2]) * 255);
                const b = Math.round(Number(srgb[3]) * 255);
                const a = srgb[4] ? Number(srgb[4]) : 1;
                value = `rgb(${r},${g},${b})`;

                v.data.attrs["fill-opacity"] = a;
            }
        }
        if (key == "font-family") {
            value = "sans-serif";
        }

        if (value.endsWith("px")) {
            value = value.substring(0, value.length - 2);
        }
        if (value != getDefaultValues(key)) {
            v.data.attrs[key] = value;
        }
    }

    if (getVNodeSVGType(v) == "text") {
        const oldY = (v.data.attrs.y as number | undefined) ?? 0;
        const fontSize = computedStyle.fontSize
            ? Number(computedStyle.fontSize.substring(0, computedStyle.fontSize.length - 2))
            : 12;
        const newY = oldY + 0.35 * fontSize;
        v.data.attrs.y = newY;
    }

    if (!v.children) return;
    for (const child of v.children) {
        if (typeof child === "string") continue;
        transformStyleToAttributes(child);
    }
}

function removeUnusedAttributes(v: VNode) {
    if (!v.data) v.data = {};
    if (v.data.attrs) {
        delete v.data.attrs["id"];
        delete v.data.attrs["tabindex"];
    }
    if (v.data.class) {
        for (const clas in v.data.class) {
            v.data.class[clas] = false;
        }
    }

    if (!v.children) return;
    for (const child of v.children) {
        if (typeof child === "string") continue;
        removeUnusedAttributes(child);
    }
}

function getVNodeSVGType(v: VNode): string | undefined {
    return v.sel?.split(/#|\./)[0];
}

function getRelevantStyleProps(v: VNode): string[] {
    const type = getVNodeSVGType(v);
    switch (type) {
        case "g":
        case "svg":
            return [];
        case "text":
            return ["font-size", "font-family", "font-weight", "text-anchor", "opacity"];
        default:
            return [
                "fill",
                "stroke",
                "stroke-width",
                "stroke-dasharray",
                "stroke-linecap",
                "stroke-linejoin",
                "opacity",
            ];
    }
}

function getDefaultValues(key: string) {
    switch (key) {
        case "stroke-dasharray":
            return "none";
        case "stroke-linecap":
            return "butt";
        case "stroke-linejoin":
            return "miter";
        case "opacity":
            return 1;
        default:
            return undefined;
    }
}
