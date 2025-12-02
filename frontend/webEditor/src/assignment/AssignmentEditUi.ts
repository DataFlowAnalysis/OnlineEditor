import { inject, injectable } from "inversify";
import { AbstractUIExtension, getAbsoluteClientBounds, SModelRootImpl, TYPES, ViewerOptions } from "sprotty";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort";
import { DOMHelper } from "sprotty/lib/base/views/dom-helper";
import { DfdNodeImpl } from "../diagram/nodes/common";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { ASSIGNMENT_LANGUAGE_ID, assignmentLanguageMonarchDefinition, AssignmentLanguageTreeBuilder } from "./language";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { DfdCompletionItemProvider } from "../languages/autocomplete";
import { LanguageTreeNode, tokenize } from "../languages/tokenize";
import { Word } from "../languages/words";
import { Theme, ThemeManager } from "../settings/Theme";
import { SETTINGS } from "../settings/Settings";
import { verify } from "../languages/verify";
import "./assignmentEditUi.css";
import { EditorModeController } from "../settings/editorMode";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";

@injectable()
export class AssignmentEditUi extends AbstractUIExtension {
    public static readonly ID = "assignment-edit-ui";

    private port?: DfdOutputPortImpl;
    private tree?: LanguageTreeNode<Word>[];
    private editorContainer: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private validationLabel: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private unavailableInputsLabel: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private editor?: monaco.editor.IStandaloneCodeEditor;

    constructor(
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController,
        @inject(SETTINGS.Theme) private readonly themeManager: ThemeManager,
        @inject(TYPES.ViewerOptions) private viewerOptions: ViewerOptions,
        @inject(TYPES.DOMHelper) private domHelper: DOMHelper,
    ) {
        super();

        editorModeController.registerListener(() => {
            this.editor?.updateOptions({
                readOnly: this.editorModeController.isReadOnly(),
            });
        });
    }

    id(): string {
        return AssignmentEditUi.ID;
    }

    containerClass(): string {
        return AssignmentEditUi.ID;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add("ui-float");

        containerElement.appendChild(this.unavailableInputsLabel);
        this.unavailableInputsLabel.classList.add("unavailable-inputs");
        containerElement.appendChild(this.editorContainer);
        this.editorContainer.classList.add("monaco-container");
        containerElement.appendChild(this.validationLabel);
        this.validationLabel.classList.add("validation-label");

        const keyboardShortcutLabel = document.createElement("div");
        keyboardShortcutLabel.innerHTML = "Press <kbd>CTRL</kbd>+<kbd>Space</kbd> for autocompletion";
        containerElement.appendChild(keyboardShortcutLabel);

        monaco.languages.register({ id: ASSIGNMENT_LANGUAGE_ID });
        monaco.languages.setMonarchTokensProvider(ASSIGNMENT_LANGUAGE_ID, assignmentLanguageMonarchDefinition);

        const monacoTheme = this.themeManager.getTheme() === Theme.DARK ? "vs-dark" : "vs";
        this.editor = monaco.editor.create(this.editorContainer, {
            minimap: {
                // takes too much space, not useful for our use case
                enabled: false,
            },
            lineNumbersMinChars: 3, // default is 5, which we'll never need. Save a bit of space.
            folding: false, // Not supported by our language definition
            wordBasedSuggestions: "off", // Does not really work for our use case
            scrollBeyondLastLine: false, // Not needed
            theme: monacoTheme,
            language: ASSIGNMENT_LANGUAGE_ID,
            readOnly: this.editorModeController.isReadOnly()
        });

        this.editor.onDidChangeModelContent(() => {
            this.validate();
        });

        this.editor.onDidContentSizeChange(() => {
            this.resizeEditor();
        });

        this.labelTypeRegistry?.onUpdate(() => {
            // The update handler for the refactoring might be after our handler.
            // Delay update to the next event loop tick to ensure the refactoring is done.
            setTimeout(() => {
                if (this.editor && this.port) {
                    this.editor?.setValue(this.port?.getBehavior());
                }
            }, 0);
        });

        // Hide/"close this window" when pressing escape.
        containerElement.addEventListener("keydown", (event) => {
            if (matchesKeystroke(event, "Escape")) {
                this.hide();
            }
        });
    }

    protected onBeforeShow(
        containerElement: HTMLElement,
        root: Readonly<SModelRootImpl>,
        ...contextElementIds: string[]
    ): void {
        // Loads data for the port that shall be edited, which is defined by the context element id.
        if (contextElementIds.length !== 1) {
            throw new Error(
                "Expected exactly one context element id which should be the port that shall be shown in the UI.",
            );
        }
        this.setPort(root.index.getById(contextElementIds[0]) as DfdOutputPortImpl, containerElement);

        this.checkForUnavailableInputs();

        this.resizeEditor();

        this.editor?.focus()
    }

    private setPort(port: DfdOutputPortImpl, containerElement: HTMLElement) {
        this.port = port;

        const bounds = getAbsoluteClientBounds(this.port, this.domHelper, this.viewerOptions);
        containerElement.style.left = `${bounds.x}px`;
        containerElement.style.top = `${bounds.y}px`;

        this.tree = AssignmentLanguageTreeBuilder.buildTree(port, this.labelTypeRegistry);
        monaco.languages.registerCompletionItemProvider(
            ASSIGNMENT_LANGUAGE_ID,
            new DfdCompletionItemProvider(this.tree),
        );
        if (!this.editor) {
            throw new Error("Expected editor to be initialized");
        }

        this.editor.setValue(port.getBehavior());
    }

    private checkForUnavailableInputs() {
        if (!this.port) {
            throw new Error("Expected Assignment Edit Ui to be assigned to a port");
        }

        const parent = this.port.parent;
        if (!(parent instanceof DfdNodeImpl)) {
            throw new Error("Expected parent to be a DfdNodeImpl.");
        }

        const availableInputNames = parent.getAvailableInputs();
        const countUnavailableDueToMissingName = availableInputNames.filter((name) => name === undefined).length;

        if (countUnavailableDueToMissingName > 0) {
            const unavailableInputsText =
                countUnavailableDueToMissingName > 1
                    ? `There are ${countUnavailableDueToMissingName} inputs that don't have a named edge and cannot be used`
                    : `There is ${countUnavailableDueToMissingName} input that doesn't have a named edge and cannot be used`;

            this.unavailableInputsLabel.innerText = unavailableInputsText;
            this.unavailableInputsLabel.style.display = "block";
        } else {
            this.unavailableInputsLabel.innerText = "";
            this.unavailableInputsLabel.style.display = "none";
        }
    }

    private resizeEditor(): void {
        // Resize editor to fit content.
        // Has ranges for height and width to prevent the editor from getting too small or too large.
        if (!this.editor) {
            return;
        }

        // For the height we can use the content height from the editor.
        const height = this.editor.getContentHeight();

        // For the width we cannot really do this.
        // Monaco needs about 500ms to figure out the correct width when initially showing the editor.
        // In the mean time the width will be too small and after the update
        // the window size will jump visibly.
        // So for the width we use this calculation to approximate the width.
        const maxLineLength = this.editor
            .getValue()
            .split("\n")
            .reduce((max, line) => Math.max(max, line.length), 0);
        const width = 100 + maxLineLength * 8;

        const clamp = (value: number, range: readonly [number, number]) =>
            Math.min(range[1], Math.max(range[0], value));

        const heightRange = [100, 350] as const;
        const widthRange = [275, 650] as const;

        const cHeight = clamp(height, heightRange);
        const cWidth = clamp(width, widthRange);

        this.editor.layout({ height: cHeight, width: cWidth });
    }

    private validate() {
        if (!this.editor || !this.tree) {
            return;
        }

        const model = this.editor?.getModel();
        if (!model) {
            return;
        }

        const content = model.getLinesContent();
        this.port?.setBehavior(content.join("\n"));
        const marker: monaco.editor.IMarkerData[] = [];
        const emptyContent = content.length == 0 || (content.length == 1 && content[0] === "");
        // empty content gets accepted as valid as it represents no constraints
        if (!emptyContent) {
            const errors = verify(tokenize(content), this.tree);
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

        if (marker.length == 0) {
            this.validationLabel.innerText = "Assignments are valid";
            this.validationLabel.classList.remove("validation-error");
            this.validationLabel.classList.add("validation-success");
        } else {
            this.validationLabel.innerText = `Assignments are invalid: ${marker.length} error${
                marker.length === 1 ? "" : "s"
            }.`;
            this.validationLabel.classList.remove("validation-success");
            this.validationLabel.classList.add("validation-error");
        }

        monaco.editor.setModelMarkers(model, "constraint", marker);
    }
}
