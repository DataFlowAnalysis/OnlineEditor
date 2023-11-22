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

import "./outputPortEditUi.css";

/**
 * Validation error for a single line of the behavior text of a dfd output port.
 */
interface PortBehaviorValidationError {
    message: string;
    line: number;
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
            const error = this.validateLine(line, port);
            if (error) {
                errors.push({
                    message: error,
                    line: i + 1,
                });
            }
        }

        return errors;
    }

    /**
     * Validates a single line and returns an error message if the line is invalid.
     * Otherwise returns undefined.
     */
    private validateLine(line: string, port: DfdOutputPortImpl): string | undefined {
        if (line === "" || line.startsWith("#") || line.startsWith("//")) {
            return;
        }

        if (line.startsWith("forward")) {
            return this.validateForwardStatement(line, port);
        }

        if (line.startsWith("set")) {
            return this.validateSetStatement(line, port);
        }

        return `Unknown statement: ${line}`;
    }

    private validateForwardStatement(line: string, port: DfdOutputPortImpl): string | undefined {
        const inputsString = line.replace("forward", "");
        const inputs = inputsString
            .split(",")
            .map((input) => input.trim())
            .filter((input) => input !== "");
        if (inputs.length === 0) {
            return "forward needs at least one input";
        }

        const duplicateInputs = inputs.filter((input, index) => inputs.indexOf(input) !== index);
        if (duplicateInputs.length > 0) {
            return "forward statements must not contain duplicate inputs";
        }

        const node = port.parent;
        if (!(node instanceof DfdNodeImpl)) {
            throw new Error("Expected port parent to be a DfdNodeImpl.");
        }

        const availableInputs = node.getAvailableInputs();

        const unavailableInputs = inputs.filter((input) => !availableInputs.includes(input));
        if (unavailableInputs.length > 0) {
            return `forward statements contains invalid input(s): ${unavailableInputs.join(", ")}`;
        }

        return undefined;
    }

    private validateSetStatement(line: string, port: DfdOutputPortImpl): string | undefined {
        const match = line.match(PortBehaviorValidator.SET_REGEX);
        if (!match) {
            return "invalid set statement";
        }

        // Check that the label type and value that this statement tries to set are valid.
        const setLabelType = match[1];
        const setLabelValue = match[2];
        const labelType = this.labelTypeRegistry?.getLabelTypes().find((type) => type.name === setLabelType);
        if (!labelType) {
            return `unknown label type: ${setLabelType}`;
        }
        if (!labelType.values.find((value) => value.text === setLabelValue)) {
            return `unknown label value (for type ${setLabelType}): ${setLabelValue}`;
        }

        // Parenthesis must be balanced.
        let parenthesisLevel = 0;
        for (const char of line) {
            if (char === "(") {
                parenthesisLevel++;
            } else if (char === ")") {
                parenthesisLevel--;
            }

            if (parenthesisLevel < 0) {
                return "invalid set statement: missing opening parenthesis";
            }
        }

        if (parenthesisLevel !== 0) {
            return "invalid set statement: missing closing parenthesis";
        }

        // Extract all used inputs, label types and the corresponding label values.
        const expression = line.split("=")[1].trim(); // get everything after the =
        const matches = expression.matchAll(PortBehaviorValidator.SET_REGEX_EXPRESSION_INPUTS);
        if (!matches) {
            return undefined;
        }

        const node = port.parent;
        if (!(node instanceof DfdNodeImpl)) {
            throw new Error("Expected port parent to be a DfdNodeImpl.");
        }
        const availableInputs = node.getAvailableInputs();

        // Check for each input access that the input exists and that the label type and value are valid.
        for (const inputMatch of matches) {
            const inputName = inputMatch[1];
            const inputLabelType = inputMatch[2];
            const inputLabelValue = inputMatch[3];

            if (!availableInputs.includes(inputName)) {
                return `unknown input (for set statement): ${inputName}`;
            }

            const inputLabelTypeObject = this.labelTypeRegistry
                ?.getLabelTypes()
                .find((type) => type.name === inputLabelType);
            if (!inputLabelTypeObject) {
                return `unknown label type: ${inputLabelType}`;
            }

            if (!inputLabelTypeObject.values.find((value) => value.text === inputLabelValue)) {
                return `unknown label value of label type ${inputLabelType}: ${inputLabelValue}`;
            }
        }

        // All fine
        return undefined;
    }
}

/**
 * Detects when a dfd output port is double clicked and shows the OutputPortEditUI
 * with the clicked port as context element.
 */
@injectable()
export class OutputPortEditUIMouseListener extends MouseListener {
    // State for double click detection.
    private previouslyClicked = false;

    mouseDown(target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] {
        if (target instanceof DfdOutputPortImpl) {
            if (this.previouslyClicked) {
                return [
                    SetUIExtensionVisibilityAction.create({
                        extensionId: OutputPortEditUI.ID,
                        visible: true,
                        contextElementsId: [target.id],
                    }),
                ];
            } else {
                this.previouslyClicked = true;
            }
        } else if (this.previouslyClicked) {
            // previouslyClicked => UI might be shown, clicked outside of UI => hide UI
            this.previouslyClicked = false;
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
}

/**
 * UI that allows editing the behavior text of a dfd output port (DfdOutputPortImpl).
 */
@injectable()
export class OutputPortEditUI extends AbstractUIExtension {
    static readonly ID = "output-port-edit-ui";

    private port: DfdOutputPortImpl | undefined;
    private availableInputs: HTMLSpanElement = document.createElement("div");
    private behaviorText: HTMLTextAreaElement = document.createElement("textarea");
    private validationLabel: HTMLSpanElement = document.createElement("div");

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
        this.behaviorText.autocomplete = "off";
        this.behaviorText.spellcheck = false;
        this.behaviorText.placeholder = "Enter behavior here";

        containerElement.appendChild(this.availableInputs);
        containerElement.appendChild(this.behaviorText);
        containerElement.appendChild(this.validationLabel);

        containerElement.classList.add("ui-float");
        this.availableInputs.classList.add("available-inputs");
        this.validationLabel.classList.add("validation-label");

        this.configureHandlers(containerElement);
    }

    private configureHandlers(containerElement: HTMLElement): void {
        // If the user unfocuses the textarea, save the changes.
        this.behaviorText.addEventListener("blur", () => {
            this.save();
        });

        // Run behavior validation on each key press and when
        // changing the text through other ways(e.g. move text via mouse drag and drop)
        this.behaviorText.addEventListener("keydown", () => this.validateBehavior());
        this.behaviorText.addEventListener("input", () => this.validateBehavior());

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

        this.behaviorText.value = this.port.behavior;
        // Validation of loaded behavior text.
        this.validateBehavior();

        // Wait for the next event loop tick to focus the port edit UI.
        // The user may have clicked more times before the show click was processed
        // (showing the UI takes some time due to finding the element in the graph, etc.).
        // There might still be some clicks in the event loop queue queue which would de-focus the port edit UI.
        // Instead process them (fast as no UI is shown or similar slow tasks are done) and then focus the UI.
        setTimeout(() => {
            containerElement.focus();
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

        const behaviorText = this.behaviorText.value;
        const results = this.validator.validate(behaviorText, this.port);
        if (results.length === 0) {
            // Everything fine
            this.validationLabel.innerText = "Behavior is valid.";
            this.validationLabel.classList.remove("validation-error");
            this.validationLabel.classList.add("validation-success");
        } else {
            // Some error
            const validationResultString = results.map((result) => `Line ${result.line}: ${result.message}`).join("\n");
            this.validationLabel.innerText = validationResultString;
            this.validationLabel.classList.remove("validation-success");
            this.validationLabel.classList.add("validation-error");
        }
    }

    /**
     * Saves the current behavior text inside the textinput element to the port.
     */
    private save(): void {
        if (!this.port) {
            throw new Error("Cannot save without set port.");
        }
        this.actionDispatcher.dispatch(SetDfdOutputPortBehaviorAction.create(this.port.id, this.behaviorText.value));
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
