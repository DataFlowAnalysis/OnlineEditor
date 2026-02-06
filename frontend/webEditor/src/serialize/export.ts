import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    isSelectable,
    IVNodePostprocessor,
    ModelRenderer,
    SChildElementImpl,
    SModelElementImpl,
    SModelRootImpl,
    SParentElementImpl,
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
import { jsPDF } from "jspdf";
import "svg2pdf.js";
import { calculateTextSize } from "../utils/TextSize";

const patch = init([
    // Init patch function with chosen modules
    classModule, // makes it easy to toggle classes
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
]);

interface ExportAction extends Action {
    saveType: "svg" | "pdf";
    selectionOnly: boolean;
}

export namespace ExportAction {
    export const KIND = "save-image";

    export function create(saveType: "svg" | "pdf", selectionOnly: boolean): ExportAction {
        return {
            kind: KIND,
            saveType,
            selectionOnly,
        };
    }
}

interface SVGResult {
    svg: string;
    width: number;
    height: number;
}

/**
 * Exports the diagram as either a svg or pdf
 */
export class ExportCommand extends Command {
    static readonly KIND = ExportAction.KIND;
    private static readonly PADDING = 5;

    constructor(
        @inject(TYPES.Action) private readonly action: ExportAction,
        @inject(FileName) private readonly fileName: FileName,
        @inject(TYPES.ViewRegistry) private readonly viewRegistry: ViewRegistry,
        @multiInject(TYPES.IVNodePostprocessor) private readonly postProcessors: IVNodePostprocessor[],
    ) {
        super();
    }

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        const dummyRoot = document.createElement("div");
        dummyRoot.style.position = "absolute";
        dummyRoot.style.left = "-100000px";
        dummyRoot.style.top = "-100000px";
        dummyRoot.style.visibility = "hidden";

        document.body.appendChild(dummyRoot);
        let result: SVGResult | undefined;
        try {
            result = this.getSVG(context, dummyRoot);
        } finally {
            document.body.removeChild(dummyRoot);
        }
        if (result) {
            if (this.action.saveType === "svg") {
                this.writeSVG(result);
            } else {
                this.writePDF(result);
            }
        }

        return context.root;
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    /**
     * Generates saveable svg code
     * @param dom A dummy root element attached to the Dom
     * @returns The generated svg
     */
    getSVG(context: CommandExecutionContext, dom: HTMLElement): SVGResult | undefined {
        // render diagram virtually
        if (this.action.selectionOnly) {
            this.postProcessors.push(new SelectionPostProcessor());
        }
        const renderer = new ModelRenderer(this.viewRegistry, "hidden", this.postProcessors);
        const svg = renderer.renderElement(context.root);
        if (!svg) return;

        // add stylesheets
        const styleHolder = document.createElement("style");
        styleHolder.innerHTML = `${themeCss}\n${elementCss}`;
        dom.appendChild(styleHolder);

        // render svg into dom
        const dummyDom = h("div", {}, [svg]);
        // remove selection as we do not want it on an export
        this.removeSelectedClass(dummyDom);
        this.removeRoutingHandles(dummyDom);
        patch(dom, dummyDom);
        // apply style and clean attributes
        this.transformStyleToAttributes(dummyDom);
        // Centering does not work properly for pdfs. We fix this manually
        if (this.action.saveType === "pdf") {
            this.centerText(dummyDom, 0);
        }
        this.removeUnusedAttributes(dummyDom);

        // compute diagram offset and size
        const holderG = svg.children?.[0];
        if (!holderG || typeof holderG == "string") return;
        const actualElements = holderG.children ?? [];
        const minTranslate = { x: Infinity, y: Infinity };
        const maxSize = { x: 0, y: 0 };
        for (const child of actualElements) {
            if (typeof child == "string") continue;
            const childTranslate = getMinTranslate(child);
            minTranslate.x = Math.min(minTranslate.x, childTranslate.x);
            minTranslate.y = Math.min(minTranslate.y, childTranslate.y);

            const childSize = getMaxRequiredCanvasSize(child);
            maxSize.x = Math.max(maxSize.x, childSize.x);
            maxSize.y = Math.max(maxSize.y, childSize.y);
        }

        // correct offset and set size
        if (!holderG.data) holderG.data = {};
        if (!holderG.data.attrs) holderG.data.attrs = {};
        holderG.data.attrs["transform"] =
            `translate(${-minTranslate.x + ExportCommand.PADDING},${-minTranslate.y + ExportCommand.PADDING})`;
        if (!svg.data) svg.data = {};
        if (!svg.data.attrs) svg.data.attrs = {};
        const width = maxSize.x - minTranslate.x + 2 * ExportCommand.PADDING;
        const height = maxSize.y - minTranslate.y + 2 * ExportCommand.PADDING;
        svg.data.attrs.width = width;
        svg.data.attrs.height = height;
        svg.data.attrs.viewBox = `0 0 ${width} ${height}`;

        // make sure element is seen as svg by all users
        svg.data.attrs.version = "1.0";
        svg.data.attrs.xmlns = "http://www.w3.org/2000/svg";

        return { svg: toHTML(svg), width, height };
    }

    async writePDF(svg: SVGResult) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = svg.svg.trim();
        const svgEl = wrapper.querySelector("svg");
        if (!svgEl) return;
        const doc = new jsPDF({
            orientation: svg.width > svg.height ? "landscape" : "portrait",
            format: [svg.width, svg.height],
        });
        await doc.svg(svgEl, {
            x: 0,
            y: 0,
            width: svg.width,
        });
        doc.save(this.fileName.getName() + ".pdf");
    }

    writeSVG(svg: SVGResult) {
        const blob = new Blob([svg.svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = this.fileName.getName() + ".svg";
        link.click();
    }

    /**
     * Recursively removes the selected class
     * Should be called before rendering
     * @param v Root VNode
     */
    private removeSelectedClass(v: VNode) {
        if (v.data?.class?.selected) {
            v.data.class.selected = false;
        }

        if (!v.children) return;
        for (const child of v.children) {
            if (typeof child === "string") continue;
            this.removeSelectedClass(child);
        }
    }

    /**
     * Recursively removes the routing handles of edges.
     * Needs to happen before removing classes
     * @param v
     * @returns
     */
    private removeRoutingHandles(v: VNode) {
        if (!v.children) return;
        v.children = v.children?.filter((c) => {
            if (typeof c == "string") return true;
            return c.data?.class?.["sprotty-routing-handle"] !== true;
        });
        for (const child of v.children) {
            if (typeof child === "string") continue;
            this.removeRoutingHandles(child);
        }
    }

    /**
     * Recursively transforms the computed style of the html elements to properties on the VNode
     * @param v The current VNode
     */
    private transformStyleToAttributes(v: VNode) {
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
            if (value != getDefaultPropertyValues(key)) {
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
            this.transformStyleToAttributes(child);
        }
    }

    /**
     * Recursively removes html attributes the svg file does not need.
     * @param v The current VNode
     */
    private removeUnusedAttributes(v: VNode) {
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
            this.removeUnusedAttributes(child);
        }
    }

    /**
     * Recursively iterates the VNodes an centers the text position manually.
     * This should happen after transforming the style to attributes
     * @param v Current VNode
     * @param maxSiblingSize biggest size of siblings
     * @param maxSiblingX biggest x of siblings
     */
    private centerText(v: VNode, maxSiblingSize: number = 0, maxSiblingX: number = 0) {
        if (getVNodeSVGType(v) == "text") {
            if (!v.data) v.data = {};
            if (!v.data.attrs) v.data.attrs = {};

            v.data.attrs["text-anchor"] = "start";
            if (v.data.class?.["port-text"] === true) {
                if (v.text === "I") {
                    v.data.attrs.x = 2.8;
                } else {
                    v.data.attrs.x = 1.3;
                }
            } else {
                const width = calculateTextSize(v.text, `${v.data.attrs["font-size"] ?? 0}px sans-serif `).width;
                v.data.attrs.x = maxSiblingSize / 2 - width / 2 + maxSiblingX;
            }
        }

        if (!v.children) return;

        let newMaxSiblingSize = undefined;
        let newMaxSiblingX = undefined;
        for (const child of v.children) {
            if (typeof child === "string") continue;
            if (getVNodeSVGType(child) == "text") continue;
            newMaxSiblingSize = Math.max(newMaxSiblingSize ?? -Infinity, Number(child.data?.attrs?.width ?? 0));
            newMaxSiblingX = Math.max(newMaxSiblingX ?? -Infinity, Number(child.data?.attrs?.x ?? 0));
        }

        for (const child of v.children) {
            if (typeof child === "string") continue;
            this.centerText(child, newMaxSiblingSize, newMaxSiblingX);
        }
    }
}

/**
 * Gets the minimum translation of an element relative to the svg.
 * This is done by recursively getting the translation of all child elements
 * @param e the element to get the translation from
 * @param parentOffset Offset of the containing element
 * @returns Minimum absolute offset of any child element relative to the svg
 */
function getMinTranslate(e: VNode, parentOffset: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number } {
    const myTranslate = getTranslate(e, parentOffset);
    const minTranslate = myTranslate ?? { x: Infinity, y: Infinity };

    const children = e.children ?? [];
    for (const child of children) {
        if (typeof child == "string") continue;
        const childTranslate = getMinTranslate(child, myTranslate);
        minTranslate.x = Math.min(minTranslate.x, childTranslate.x);
        minTranslate.y = Math.min(minTranslate.y, childTranslate.y);
    }
    return minTranslate;
}

/**
 * Calculates the absolute translation of an element relative to the svg.
 * @param e the element to get the translation from
 * @param parentOffset Offset of the containing element
 * @returns Offset of the child relative to the svg
 */
function getTranslate(
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

/**
 * Gets the maximum size the canvas needs by adding its position and size and finding the maximum of this among children.
 * This is done by recursively.
 * @param e the root element for the sizing
 * @param parentOffset Offset of the containing element
 * @returns Required canvas size
 */
function getMaxRequiredCanvasSize(
    e: VNode,
    parentOffset: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
    const myTranslate = getTranslate(e, parentOffset);
    const maxSize = getRequiredCanvasSize(e, parentOffset);

    const children = e.children ?? [];
    for (const child of children) {
        if (typeof child == "string") continue;
        const childTranslate = getMaxRequiredCanvasSize(child, myTranslate);
        maxSize.x = Math.max(maxSize.x, childTranslate.x);
        maxSize.y = Math.max(maxSize.y, childTranslate.y);
    }
    return maxSize;
}

/**
 * Calculates the size the canvas needs to be to accommodate the given element
 * @param e the element to calculate for
 * @param parentOffset Offset of the containing element
 * @returns The size required for the element
 */
function getRequiredCanvasSize(
    e: VNode,
    parentOffset: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
    const width = (e.data?.attrs?.["width"] as number | undefined) ?? 0;
    const height = (e.data?.attrs?.["height"] as number | undefined) ?? 0;
    const translate = getTranslate(e, parentOffset) ?? parentOffset;

    const x = translate.x + width;
    const y = translate.y + height;
    return { x: x, y: y };
}

function getVNodeSVGType(v: VNode): string | undefined {
    return v.sel?.split(/#|\./)[0];
}

/**
 * @param v VNode to check
 * @returns The relevant style properties for the node type
 */
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

/**
 * @param key CSS key
 * @returns The default value for a given CSS key
 */
function getDefaultPropertyValues(key: string) {
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

/**
 * VNodePostprocessor removing all non-selected elements
 */
class SelectionPostProcessor implements IVNodePostprocessor {
    decorate(v: VNode, element: SModelElementImpl): VNode {
        let shouldRender = this.isSelected(element);
        if (element instanceof SChildElementImpl && this.hasSelectedParent(element)) {
            shouldRender = true;
        }
        if (element instanceof SParentElementImpl && this.hasSelectedChild(element)) {
            shouldRender = true;
        }
        if (shouldRender) {
            return v;
        }
        return h("g");
    }
    postUpdate() {}

    private hasSelectedParent(element: Readonly<SChildElementImpl>) {
        if (this.isSelected(element.parent)) {
            return true;
        }
        if (element.parent instanceof SChildElementImpl) {
            if (this.hasSelectedParent(element.parent)) {
                return true;
            }
        }
        return false;
    }

    private hasSelectedChild(element: Readonly<SParentElementImpl>) {
        for (const child of element.children) {
            if (this.isSelected(child)) {
                return true;
            }
            if (this.hasSelectedChild(child)) {
                return true;
            }
        }
        return false;
    }

    private isSelected(element: Readonly<SModelElementImpl>) {
        return isSelectable(element) && element.selected;
    }
}
