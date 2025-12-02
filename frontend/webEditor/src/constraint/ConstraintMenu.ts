import { inject, injectable } from "inversify";
import "./constraintMenu.css";
import {  IActionDispatcher, LocalModelSource, TYPES } from "sprotty";
import { ConstraintRegistry } from "./constraintRegistry";

// Enable hover feature that is used to show validation errors.
// Inline completions are enabled to allow autocompletion of keywords and inputs/label types/label values.
import "monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution";
import "monaco-editor/esm/vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution.js";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SETTINGS } from "../settings/Settings";
import { EditorModeController } from "../settings/editorMode";
import { AccordionUiExtension } from "../accordionUiExtension";
import { LanguageTreeNode, tokenize } from "../languages/tokenize";
import { Word } from "../languages/words";
import { constraintDslLanguageMonarchDefinition, ConstraintDslTreeBuilder, DSL_LANGUAGE_ID } from "./language";
import { verify } from "../languages/verify";
import { DfdCompletionItemProvider } from "../languages/autocomplete";
import { AnalyzeAction } from "../serialize/analyze";
import { ApplyableTheme, Theme, ThemeManager, ThemeSwitchable } from "../settings/Theme";
import { SelectConstraintsAction } from "./selection";

@injectable()
export class ConstraintMenu extends AccordionUiExtension implements ThemeSwitchable {
    static readonly ID = "constraint-menu";
    private editorContainer: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private validationLabel: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private editor?: monaco.editor.IStandaloneCodeEditor;
    private forceReadOnly: boolean;
    private optionsMenu?: HTMLDivElement;
    private ignoreCheckboxChange = false;
    private readonly tree: LanguageTreeNode<Word>[]

    constructor(
        @inject(ConstraintRegistry) private readonly constraintRegistry: ConstraintRegistry,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(TYPES.ModelSource) modelSource: LocalModelSource,
        @inject(TYPES.IActionDispatcher) private readonly dispatcher: IActionDispatcher,
        @inject(SETTINGS.Mode)
        editorModeController: EditorModeController,
        @inject(SETTINGS.Theme) private readonly themeManager: ThemeManager
    ) {
        super("left", "up");
        this.constraintRegistry = constraintRegistry;
        this.forceReadOnly = editorModeController.get() !== "edit";
        editorModeController.registerListener(() => {
            this.forceReadOnly = editorModeController.isReadOnly();
        });
        constraintRegistry.onUpdate(() => {
            if (this.editor) {
                const editorText = this.editor.getValue();
                // Only update the editor if the constraints have changed
                if (editorText !== this.constraintRegistry.getConstraintsAsText()) {
                    this.editor.setValue(this.constraintRegistry.getConstraintsAsText() || "");
                }
            }
        });

        this.tree = ConstraintDslTreeBuilder.buildTree(modelSource, labelTypeRegistry)
    }

    id(): string {
        return ConstraintMenu.ID;
    }
    containerClass(): string {
        return ConstraintMenu.ID;
    }

    
    protected initializeHeaderContent(headerElement: HTMLElement): void {
        headerElement.id = 'constraint-menu-expand-title'
        headerElement.innerText = 'Constraints'
        headerElement.appendChild(this.buildOptionsButton());
    }

    protected initializeHidableContent(contentElement: HTMLElement): void {
        const contentDiv = document.createElement("div");
        contentDiv.id = "constraint-menu-content";
        contentDiv.appendChild(this.buildConstraintInputWrapper());
        contentElement.appendChild(contentDiv)
    }

    protected initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);
        containerElement.appendChild(this.buildRunButton());
    }

    private buildConstraintInputWrapper(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.id = "constraint-menu-input";
        wrapper.appendChild(this.editorContainer);
        this.validationLabel.id = "validation-label";
        this.validationLabel.classList.add("valid");
        this.validationLabel.innerText = "Valid constraints";
        wrapper.appendChild(this.validationLabel);
        const keyboardShortcutLabel = document.createElement("div");
        keyboardShortcutLabel.innerHTML = "Press <kbd>CTRL</kbd>+<kbd>Space</kbd> for autocompletion";
        wrapper.appendChild(keyboardShortcutLabel);

        monaco.languages.register({ id: DSL_LANGUAGE_ID });
        monaco.languages.setMonarchTokensProvider(DSL_LANGUAGE_ID, constraintDslLanguageMonarchDefinition);
        monaco.languages.registerCompletionItemProvider(
            DSL_LANGUAGE_ID,
            new DfdCompletionItemProvider(this.tree),
        );

        const monacoTheme = this.themeManager.getTheme() === Theme.DARK ? "vs-dark" : "vs";
        this.editor = monaco.editor.create(this.editorContainer, {
            minimap: {
                // takes too much space, not useful for our use case
                enabled: false,
            },
            folding: false, // Not supported by our language definition
            wordBasedSuggestions: "off", // Does not really work for our use case
            scrollBeyondLastLine: false, // Not needed
            theme: monacoTheme,
            wordWrap: "on",
            language: DSL_LANGUAGE_ID,
            scrollBeyondLastColumn: 0,
            scrollbar: {
                horizontal: "hidden",
                vertical: "auto",
                // avoid can not scroll page when hover monaco
                alwaysConsumeMouseWheel: false,
            },
            lineNumbers: "on",
            readOnly: this.forceReadOnly,
        });

        this.editor.setValue(this.constraintRegistry.getConstraintsAsText() || "");

        this.editor.onDidChangeModelContent(() => {
            if (!this.editor) {
                return;
            }

            const model = this.editor?.getModel();
            if (!model) {
                return;
            }

            this.constraintRegistry.setConstraints(model.getLinesContent());

            const content = model.getLinesContent();
            const marker: monaco.editor.IMarkerData[] = [];
            const emptyContent = content.length == 0 || (content.length == 1 && content[0] === "");
            // empty content gets accepted as valid as it represents no constraints
            if (!emptyContent) {
                const errors = verify(tokenize(content), this.tree)
                marker.push(
                    ...errors.map((e) => ({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: e.line,
                        startColumn: e.startColumn,
                        endLineNumber: e.line,
                        endColumn: e.endColumn,
                        message: e.message,
                    })),
                );
            }

            this.validationLabel.innerText =
                marker.length == 0 ? "Valid constraints" : `Invalid constraints: ${marker.length} errors`;
            this.validationLabel.classList.toggle("valid", marker.length == 0);

            monaco.editor.setModelMarkers(model, "constraint", marker);
        });

        return wrapper;
    }

    private buildRunButton(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.id = "run-button-container";

        const button = document.createElement("button");
        button.id = "run-button";
        button.innerHTML = "Run";
        button.onclick = () => {
            this.dispatcher.dispatchAll([AnalyzeAction.create(), SelectConstraintsAction.create(this.constraintRegistry.getConstraintList().map(c => c.name))]);
        };

        wrapper.appendChild(button);
        return wrapper;
    }

    protected onBeforeShow(): void {
        this.resizeEditor();
    }

    private resizeEditor(): void {
        // Resize editor to fit content.
        // Has ranges for height and width to prevent the editor from getting too small or too large.
        const e = this.editor;
        if (!e) {
            return;
        }

        // For the height we can use the content height from the editor.
        const height = e.getContentHeight();

        // For the width we cannot really do this.
        // Monaco needs about 500ms to figure out the correct width when initially showing the editor.
        // In the mean time the width will be too small and after the update
        // the window size will jump visibly.
        // So for the width we use this calculation to approximate the width.
        const maxLineLength = e
            .getValue()
            .split("\n")
            .reduce((max, line) => Math.max(max, line.length), 0);
        const width = 100 + maxLineLength * 8;

        const clamp = (value: number, range: readonly [number, number]) =>
            Math.min(range[1], Math.max(range[0], value));

        const heightRange = [200, 200] as const;
        const widthRange = [500, 750] as const;

        const cHeight = clamp(height, heightRange);
        const cWidth = clamp(width, widthRange);

        e.layout({ height: cHeight, width: cWidth });
    }

    switchTheme(theme: ApplyableTheme): void {
        this.editor?.updateOptions({ theme: theme == Theme.DARK ? "vs-dark" : "vs" });
    }

    private buildOptionsButton(): HTMLElement {
        const btn = document.createElement("button");
        btn.id = "constraint-options-button";
        btn.title = "Filter…";
        btn.innerHTML = '<span class="codicon codicon-kebab-vertical"></span>';
        btn.onclick = () => this.toggleOptionsMenu();
        return btn;
    }

    /** show or hide the menu, generate checkboxes on the fly */
    private toggleOptionsMenu(): void {
        if (this.optionsMenu !== undefined) {
            this.optionsMenu.remove();
            this.optionsMenu = undefined;
            return;
        }

        // 1) create container
        this.optionsMenu = document.createElement("div");
        this.optionsMenu.id = "constraint-options-menu";

        // 2) add the “All constraints” checkbox at the top
        const allConstraints = document.createElement("label");
        allConstraints.classList.add("options-item");

        const allCb = document.createElement("input");
        allCb.type = "checkbox";
        allCb.value = "ALL";
        allCb.checked = this.constraintRegistry
            .getConstraintList()
            .map((c) => c.name)
            .every((c) => this.constraintRegistry.getSelectedConstraints().includes(c));

        allCb.onchange = () => {
            if (!this.optionsMenu) return;

            this.ignoreCheckboxChange = true;
            try {
                if (allCb.checked) {
                    this.optionsMenu.querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach((cb) => {
                        if (cb !== allCb) cb.checked = true;
                    });
                    this.dispatcher.dispatch(
                        SelectConstraintsAction.create(this.constraintRegistry.getConstraintList().map((c) => c.name)),
                    );
                } else {
                    this.optionsMenu.querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach((cb) => {
                        if (cb !== allCb) cb.checked = false;
                    });
                    this.dispatcher.dispatch(SelectConstraintsAction.create([]));
                }
            } finally {
                this.ignoreCheckboxChange = false;
            }
        };

        allConstraints.appendChild(allCb);
        allConstraints.appendChild(document.createTextNode("All constraints"));
        this.optionsMenu.appendChild(allConstraints);

        // 2) pull your dynamic items
        const items = this.constraintRegistry.getConstraintList();

        // 3) for each item build a checkbox
        items.forEach((item) => {
            const label = document.createElement("label");
            label.classList.add("options-item");

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = item.name;
            cb.checked = this.constraintRegistry.getSelectedConstraints().includes(cb.value);

            cb.onchange = () => {
                if (this.ignoreCheckboxChange) return;

                const checkboxes = this.optionsMenu!.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
                const individualCheckboxes = Array.from(checkboxes).filter((cb) => cb !== allCb);
                const selected = individualCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);

                allCb.checked = individualCheckboxes.every((cb) => cb.checked);

                this.dispatcher.dispatch(SelectConstraintsAction.create(selected));
            };

            label.appendChild(cb);
            label.appendChild(document.createTextNode(item.name));
            this.optionsMenu!.appendChild(label);
        });

        this.editorContainer.appendChild(this.optionsMenu);

        // optional: click-outside handler
        const onClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!this.optionsMenu || this.optionsMenu.contains(target)) return;

            const button = document.getElementById("constraint-options-button");
            if (button && button.contains(target)) return;

            this.optionsMenu.remove();
            this.optionsMenu = undefined;
            document.removeEventListener("click", onClickOutside);
        };
        document.addEventListener("click", onClickOutside);
    }
}
