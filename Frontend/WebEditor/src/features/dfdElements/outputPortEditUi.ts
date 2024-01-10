import { inject, injectable, optional } from "inversify";
import {
    AbstractUIExtension,
    ActionDispatcher,
    Command,
    CommandExecutionContext,
    CommandReturn,
    CommitModelAction,
    MouseListener,
    SModelElementImpl,
    SModelRootImpl,
    SetUIExtensionVisibilityAction,
    TYPES,
    ViewerOptions,
    getAbsoluteClientBounds,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { DOMHelper } from "sprotty/lib/base/views/dom-helper";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { DfdOutputPortImpl } from "./ports";
import { DfdNodeImpl } from "./nodes";
import { LabelTypeRegistry } from "../labels/labelTypeRegistry";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// Enable hover feature that is used to show validation errors.
import "monaco-editor/esm/vs/editor/contrib/hover/browser/hover";

import "./outputPortEditUi.css";

/**
 * Validation error for a single line of the behavior text of a dfd output port.
 */
interface PortBehaviorValidationError {
    message: string;
    // line and column numbers start at 0!
    line: number;
    colStart?: number;
    colEnd?: number;
}

/**
 * Validates the behavior text of a dfd output port (DfdOutputPortImpl).
 * Used inside the OutputPortEditUI.
 */
@injectable()
export class PortBehaviorValidator {
    // Regex that validates a set statement.
    // Has the label type and label value that should be set as capturing groups.
    private static readonly SET_REGEX =
        /^set +([A-z][A-z0-9-]*)\.([A-z][A-z0-9-]*) *= *(?: +|!|TRUE|FALSE|\|\||&&|\(|\)|[A-z][A-z0-9-]*(?:\.[A-z][A-z0-9-]*){2})+$/;
    // Regex that is used to extract all inputs, their label types and label values from a set statement.
    // Each input is a match with the input name, label type and label value as capturing groups.
    private static readonly SET_REGEX_EXPRESSION_INPUTS = /([A-z][A-z0-9]*)\.([A-z][A-z0-9]*)\.([A-z][A-z0-9]*)/g;
    // Regex matching alphanumeric characters.
    private static readonly REGEX_ALPHANUMERIC = /[a-zA-Z0-9]+/;

    constructor(@inject(LabelTypeRegistry) @optional() private readonly labelTypeRegistry?: LabelTypeRegistry) {}

    /**
     * validates the whole behavior text of a port.
     * @param behaviorText the behavior text to validate
     * @param port the port that the behavior text should be tested against (relevant for available inputs)
     * @returns errors, if everything is fine the array is empty
     */
    validate(behaviorText: string, port: DfdOutputPortImpl): PortBehaviorValidationError[] {
        const lines = behaviorText.split("\n");
        const errors: PortBehaviorValidationError[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineErrors = this.validateLine(line, i, port);
            if (lineErrors) {
                const errorsCols = lineErrors.map((error) => {
                    // Set cols to start/end of line if not set.
                    error.colEnd ??= line.length;
                    error.colStart ??= 0;

                    return error;
                });

                errors.push(...errorsCols);
            }
        }

        return errors;
    }

    /**
     * Validates a single line and returns an error message if the line is invalid.
     * Otherwise returns undefined.
     */
    private validateLine(
        line: string,
        lineNumber: number,
        port: DfdOutputPortImpl,
    ): PortBehaviorValidationError[] | undefined {
        if (line === "" || line.startsWith("#") || line.startsWith("//")) {
            return;
        }

        if (line.startsWith("forward")) {
            return this.validateForwardStatement(line, lineNumber, port);
        }

        if (line.startsWith("set")) {
            return this.validateSetStatement(line, lineNumber, port);
        }

        return [
            {
                line: lineNumber,
                message: "Unknown statement",
            },
        ];
    }

    private validateForwardStatement(
        line: string,
        lineNumber: number,
        port: DfdOutputPortImpl,
    ): PortBehaviorValidationError[] | undefined {
        const inputsString = line.replace("forward", "");
        const inputs = inputsString
            .split(",")
            .map((input) => input.trim())
            .filter((input) => input !== "");
        if (inputs.length === 0) {
            return [
                {
                    line: lineNumber,
                    message: "forward needs at least one input",
                },
            ];
        }

        const duplicateInputs = inputs.filter((input) => inputs.filter((i) => i === input).length > 1);
        if (duplicateInputs.length > 0) {
            const distinctDuplicateInputs = [...new Set(duplicateInputs)];

            return distinctDuplicateInputs.flatMap((input) => {
                // find all occurrences of the duplicate input
                const indices = [];
                let idx = line.indexOf(input);
                while (idx !== -1) {
                    // Ensure this is not a substring of another input by
                    // ensuring the character before and after the input are not alphanumeric.
                    // E.g. Input "te" should not detect input "test" as a duplicate of "te".
                    if (
                        !line[idx - 1]?.match(PortBehaviorValidator.REGEX_ALPHANUMERIC) &&
                        !line[idx + input.length]?.match(PortBehaviorValidator.REGEX_ALPHANUMERIC)
                    ) {
                        indices.push(idx);
                    }

                    idx = line.indexOf(input, idx + 1);
                }

                // Create an error for each occurrence of the duplicate input
                return indices.map((index) => ({
                    line: lineNumber,
                    message: `duplicate input: ${input}`,
                    colStart: index,
                    colEnd: index + input.length,
                }));
            });
        }

        const node = port.parent;
        if (!(node instanceof DfdNodeImpl)) {
            throw new Error("Expected port parent to be a DfdNodeImpl.");
        }

        const availableInputs = node.getAvailableInputs();

        const unavailableInputs = inputs.filter((input) => !availableInputs.includes(input));
        if (unavailableInputs.length > 0) {
            return unavailableInputs.map((input) => {
                let foundCorrectInput = false;
                let idx = line.indexOf(input);
                while (!foundCorrectInput) {
                    // Ensure this is not a substring of another input.
                    // Same as above.
                    foundCorrectInput =
                        !line[idx - 1]?.match(PortBehaviorValidator.REGEX_ALPHANUMERIC) &&
                        !line[idx + input.length]?.match(PortBehaviorValidator.REGEX_ALPHANUMERIC);

                    if (!foundCorrectInput) {
                        idx = line.indexOf(input, idx + 1);
                    }
                }

                return {
                    line: lineNumber,
                    message: `invalid/unknown input: ${input}`,
                    colStart: idx,
                    colEnd: idx + input.length,
                };
            });
        }

        return undefined;
    }

    private validateSetStatement(
        line: string,
        lineNumber: number,
        port: DfdOutputPortImpl,
    ): PortBehaviorValidationError[] | undefined {
        const match = line.match(PortBehaviorValidator.SET_REGEX);
        if (!match) {
            return [
                {
                    line: lineNumber,
                    message: "invalid set statement",
                },
            ];
        }

        // Check that the label type and value that this statement tries to set are valid.
        const setLabelType = match[1];
        const setLabelValue = match[2];
        const labelType = this.labelTypeRegistry?.getLabelTypes().find((type) => type.name === setLabelType);
        if (!labelType) {
            return [
                {
                    line: lineNumber,
                    message: `unknown label type: ${setLabelType}`,
                    colStart: line.indexOf(setLabelType),
                    colEnd: line.indexOf(setLabelType) + setLabelType.length,
                },
            ];
        }
        if (!labelType.values.find((value) => value.text === setLabelValue)) {
            return [
                {
                    line: lineNumber,
                    message: `unknown label value of label type ${setLabelType}: ${setLabelValue}`,
                    colStart: line.indexOf(setLabelValue),
                    colEnd: line.indexOf(setLabelValue) + setLabelValue.length,
                },
            ];
        }

        // Parenthesis must be balanced.
        let parenthesisLevel = 0;
        for (let strIdx = 0; strIdx < line.length; strIdx++) {
            const char = line[strIdx];
            if (char === "(") {
                parenthesisLevel++;
            } else if (char === ")") {
                parenthesisLevel--;
            }

            if (parenthesisLevel < 0) {
                return [
                    {
                        line: lineNumber,
                        message: "invalid set statement: missing opening parenthesis",
                        colStart: strIdx,
                        colEnd: strIdx + 1,
                    },
                ];
            }
        }

        if (parenthesisLevel !== 0) {
            return [
                {
                    line: lineNumber,
                    message: "invalid set statement: missing closing parenthesis",
                },
            ];
        }

        // Extract all used inputs, label types and the corresponding label values.
        const expression = line.split("=")[1].trim(); // get everything after the =
        if (expression.length === 0) {
            return [
                {
                    line: lineNumber,
                    message: "invalid set statement: missing expression",
                },
            ];
        }

        const matches = [...expression.matchAll(PortBehaviorValidator.SET_REGEX_EXPRESSION_INPUTS)];

        const node = port.parent;
        if (!(node instanceof DfdNodeImpl)) {
            throw new Error("Expected port parent to be a DfdNodeImpl.");
        }
        const availableInputs = node.getAvailableInputs();

        // Check for each input access that the input exists and that the label type and value are valid.
        const inputAccessErrors = [];
        for (const inputMatch of matches) {
            const inputName = inputMatch[1];
            const inputLabelType = inputMatch[2];
            const inputLabelValue = inputMatch[3];

            if (!availableInputs.includes(inputName)) {
                // Find all occurrences of the unavailable input.
                let idx = line.indexOf(inputName);
                while (idx !== -1) {
                    // Check that this is not a substring of another input.
                    if (
                        // before must not be alphanumeric => start of this string must be the beginning of the input name
                        line[idx - 1]?.match(PortBehaviorValidator.REGEX_ALPHANUMERIC) &&
                        line[idx + inputName.length] === "." // must be followed by a dot to access the label type of the input
                    ) {
                        inputAccessErrors.push({
                            line: lineNumber,
                            message: `invalid/unknown input: ${inputName}`,
                            colStart: idx,
                            colEnd: idx + inputName.length,
                        });
                    }

                    idx = line.indexOf(inputName, idx + 1);
                }

                continue;
            }

            const inputLabelTypeObject = this.labelTypeRegistry
                ?.getLabelTypes()
                .find((type) => type.name === inputLabelType);
            if (!inputLabelTypeObject) {
                let idx = line.indexOf(inputLabelType);
                while (idx !== -1) {
                    // Check that this is not a substring of another label type.
                    if (
                        // must start after a dot and end before a dot
                        line[idx - 1] === "." &&
                        line[idx + inputLabelType.length] === "."
                    ) {
                        inputAccessErrors.push({
                            line: lineNumber,
                            message: `unknown label type: ${inputLabelType}`,
                            colStart: idx,
                            colEnd: idx + inputLabelType.length,
                        });
                    }

                    idx = line.indexOf(inputLabelType, idx + 1);
                }
            } else if (!inputLabelTypeObject.values.find((value) => value.text === inputLabelValue)) {
                let idx = line.indexOf(inputLabelValue);
                while (idx !== -1) {
                    // Check that this is not a substring of another label value.
                    if (
                        // must start after a dot and end at the end of the alphanumeric text
                        line[idx - 1] === "." &&
                        // Might be at the end of the line
                        (!line[idx + inputLabelValue.length] ||
                            !line[idx + inputLabelValue.length].match(PortBehaviorValidator.REGEX_ALPHANUMERIC))
                    ) {
                        inputAccessErrors.push({
                            line: lineNumber,
                            message: `unknown label value of label type ${inputLabelType}: ${inputLabelValue}`,
                            colStart: idx,
                            colEnd: idx + inputLabelValue.length,
                        });
                    }

                    idx = line.indexOf(inputLabelValue, idx + 1);
                }
            }
        }

        return inputAccessErrors.length > 0 ? inputAccessErrors : undefined;
    }
}

/**
 * Detects when a dfd output port is double clicked and shows the OutputPortEditUI
 * with the clicked port as context element.
 */
@injectable()
export class OutputPortEditUIMouseListener extends MouseListener {
    private editUIVisible = false;

    mouseDown(target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] {
        if (this.editUIVisible) {
            // The user has clicked somewhere on the sprotty diagram (not the port edit UI)
            // while the UI was open. In this case we hide the UI.
            // This may not be exactly accurate because the UI can close itself when
            // the change was saved but in those cases editUIVisible is still true.
            // However hiding it one more time here for those cases is not a problem.
            // Because it is already hidden, nothing will happen and after one click
            // editUIVisible will be false again.
            this.editUIVisible = false;
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: OutputPortEditUI.ID,
                    visible: false,
                    contextElementsId: [target.id],
                }),
            ];
        }

        return [];
    }

    doubleClick(target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] {
        if (target instanceof DfdOutputPortImpl) {
            // The user has double clicked on a dfd output port
            // => show the OutputPortEditUI for this port.
            this.editUIVisible = true;
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: OutputPortEditUI.ID,
                    visible: true,
                    contextElementsId: [target.id],
                }),
            ];
        }

        return [];
    }
}

/**
 * UI that allows editing the behavior text of a dfd output port (DfdOutputPortImpl).
 */
@injectable()
export class OutputPortEditUI extends AbstractUIExtension {
    static readonly ID = "output-port-edit-ui";

    private availableInputs: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private editorContainer: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    private validationLabel: HTMLDivElement = document.createElement("div") as HTMLDivElement;

    private port: DfdOutputPortImpl | undefined;
    private editor?: monaco.editor.IStandaloneCodeEditor;

    constructor(
        @inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher,
        @inject(TYPES.ViewerOptions) private viewerOptions: ViewerOptions,
        @inject(TYPES.DOMHelper) private domHelper: DOMHelper,
        @inject(PortBehaviorValidator) private validator: PortBehaviorValidator,
    ) {
        super();
    }

    id(): string {
        return OutputPortEditUI.ID;
    }

    containerClass(): string {
        // The container element gets this class name by the sprotty base class.
        return "output-port-edit-ui";
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.appendChild(this.availableInputs);
        containerElement.appendChild(this.editorContainer);
        containerElement.appendChild(this.validationLabel);

        containerElement.classList.add("ui-float");
        this.availableInputs.classList.add("available-inputs");
        this.editorContainer.classList.add("monaco-container");
        this.validationLabel.classList.add("validation-label");

        // Initialize the monaco editor and setup the language for highlighting.
        monaco.languages.register({ id: "dfd-behavior" });
        monaco.languages.setMonarchTokensProvider("dfd-behavior", {
            keywords: ["forward", "set", "TRUE", "FALSE"],

            operators: ["=", "||", "&&", "!"],

            brackets: [
                {
                    open: "(",
                    close: ")",
                    token: "delimiter.parenthesis",
                },
            ],

            symbols: /[=><!~?:&|+\-*\/\^%]+/,

            tokenizer: {
                root: [
                    // keywords and identifiers
                    [
                        /[a-zA-Z_$][\w$]*/,
                        {
                            cases: {
                                "@keywords": "keyword",
                                "@default": "identifier",
                            },
                        },
                    ],

                    // whitespace
                    [/[ \t\r\n]+/, "white"],
                    [/\/\/.*$/, "comment"],
                    [/#.*$/, "comment"],

                    // delimiters and operators
                    [/[()]/, "@brackets"],
                    [
                        /@symbols/,
                        {
                            cases: {
                                "@operators": "operator",
                                "@default": "",
                            },
                        },
                    ],
                ],
            },
        });

        const monacoTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "vs-dark" : "vs";
        this.editor = monaco.editor.create(this.editorContainer, {
            minimap: {
                enabled: false,
            },
            lineNumbersMinChars: 3,
            folding: false,
            wordBasedSuggestions: "off",
            links: false,
            theme: monacoTheme,
            language: "dfd-behavior",
        });

        this.configureHandlers(containerElement);
    }

    private configureHandlers(containerElement: HTMLElement): void {
        // If the user unfocuses the editor, save the changes.
        this.editor?.onDidBlurEditorText(() => {
            // Check that the UI is still visible.
            // When Esc pressed (handler below) this is still called due to the blur
            // but the current state should not be saved in that case.
            if (this.containerElement.style.visibility === "visible") {
                this.save();
            }
        });

        // Run behavior validation when the behavior text changes.
        this.editor?.onDidChangeModelContent(() => {
            this.validateBehavior();
        });

        // Hide/"close this window" when pressing escape and don't save changes in that case.
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
        this.port = root.index.getById(contextElementIds[0]) as DfdOutputPortImpl;
        this.setPosition(containerElement);

        const parent = this.port.parent;
        if (!(parent instanceof DfdNodeImpl)) {
            throw new Error("Expected parent to be a DfdNodeImpl.");
        }

        const availableInputNames = parent.getAvailableInputs();
        const countUnavailableDueToMissingName = availableInputNames.filter((name) => name === undefined).length;
        const definedInputNames = availableInputNames.filter((name) => name !== undefined);

        let availableInputsText = "";
        if (definedInputNames.length === 0) {
            availableInputsText = "There are no available inputs.";
        } else {
            availableInputsText = `Available inputs: ${definedInputNames.join(", ")}`;
        }

        if (countUnavailableDueToMissingName > 0) {
            availableInputsText += `\nThere are ${countUnavailableDueToMissingName} available inputs that don't have a named edge and cannot be used.`;
        }
        this.availableInputs.innerText = availableInputsText;

        // Load the current behavior text of the port into the text editor.
        this.editor?.setValue(this.port.behavior);
        this.editor?.layout();

        // Validation of loaded behavior text.
        this.validateBehavior();

        // Wait for the next event loop tick to focus the port edit UI.
        // The user may have clicked more times before the show click was processed
        // (showing the UI takes some time due to finding the element in the graph, etc.).
        // There might still be some clicks in the event loop queue queue which would de-focus the port edit UI.
        // Instead process them (fast as no UI is shown or similar slow tasks are done) and then focus the UI.
        setTimeout(() => {
            this.editor?.focus();
        }, 0); // 0ms => next event loop tick
    }

    /**
     * Sets the position of the UI to the position of the port that is currently edited.
     */
    private setPosition(containerElement: HTMLElement) {
        if (!this.port) {
            return;
        }

        const bounds = getAbsoluteClientBounds(this.port, this.domHelper, this.viewerOptions);
        containerElement.style.left = `${bounds.x}px`;
        containerElement.style.top = `${bounds.y}px`;
    }

    private validateBehavior(): void {
        if (!this.port) {
            return;
        }

        const behaviorText = this.editor?.getValue() ?? "";
        const results = this.validator.validate(behaviorText, this.port);
        if (results.length === 0) {
            // Everything fine
            this.validationLabel.innerText = "Behavior is valid.";
            this.validationLabel.classList.remove("validation-error");
            this.validationLabel.classList.add("validation-success");
        } else {
            // Some error
            this.validationLabel.innerText = `Behavior is invalid: ${results.length} error${
                results.length === 1 ? "" : "s"
            }.`;
            this.validationLabel.classList.remove("validation-success");
            this.validationLabel.classList.add("validation-error");
        }

        // Add markers for each error to monaco (if any)
        const markers: monaco.editor.IMarkerData[] = results.map((result) => ({
            severity: monaco.MarkerSeverity.Error,
            message: result.message,
            startLineNumber: result.line + 1,
            startColumn: (result.colStart ?? 0) + 1,
            endLineNumber: result.line + 1,
            endColumn: (result.colEnd ?? 0) + 1,
        }));

        const model = this.editor?.getModel();
        if (model) {
            monaco.editor.setModelMarkers(model, "owner", markers);
        }
    }

    /**
     * Saves the current behavior text inside the editor to the port.
     */
    private save(): void {
        if (!this.port) {
            throw new Error("Cannot save without set port.");
        }

        const behaviorText = this.editor?.getValue() ?? "";
        this.actionDispatcher.dispatch(SetDfdOutputPortBehaviorAction.create(this.port.id, behaviorText));
        this.actionDispatcher.dispatch(CommitModelAction.create());
    }
}

/**
 * Sets the behavior property of a dfd output port (DfdOutputPortImpl).
 * This is used by the OutputPortEditUI but implemented as an action for undo/redo support.
 */
export interface SetDfdOutputPortBehaviorAction extends Action {
    kind: typeof SetDfdOutputPortBehaviorAction.KIND;
    portId: string;
    behavior: string;
}
export namespace SetDfdOutputPortBehaviorAction {
    export const KIND = "setDfdOutputPortBehavior";
    export function create(portId: string, behavior: string): SetDfdOutputPortBehaviorAction {
        return {
            kind: KIND,
            portId,
            behavior,
        };
    }
}

@injectable()
export class SetDfdOutputPortBehaviorCommand extends Command {
    static readonly KIND = SetDfdOutputPortBehaviorAction.KIND;

    constructor(@inject(TYPES.Action) private action: SetDfdOutputPortBehaviorAction) {
        super();
    }

    private oldBehavior: string | undefined;

    execute(context: CommandExecutionContext): CommandReturn {
        const port = context.root.index.getById(this.action.portId) as DfdOutputPortImpl;
        this.oldBehavior = port.behavior;
        port.behavior = this.action.behavior;
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const port = context.root.index.getById(this.action.portId) as DfdOutputPortImpl;
        if (this.oldBehavior) {
            port.behavior = this.oldBehavior;
        }

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
