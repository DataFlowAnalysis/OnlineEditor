import {
    ActionDispatcher,
    Command,
    CommandExecutionContext,
    EMPTY_ROOT,
    ILogger,
    NullLogger,
    SModelRootImpl,
    SNodeImpl,
    TYPES,
    isLocateable,
} from "sprotty";
import { Action, SModelRoot } from "sprotty-protocol";
import { DynamicChildrenProcessor } from "../dfdElements/dynamicChildren";
import { inject, optional } from "inversify";
import { createDefaultFitToScreenAction } from "../../utils";
import { SavedDiagram } from "./save";
import { LabelType, LabelTypeRegistry } from "../labels/labelTypeRegistry";
import { LayoutModelAction } from "../autoLayout/command";

export interface LoadDiagramAction extends Action {
    kind: typeof LoadDiagramAction.KIND;
}
export namespace LoadDiagramAction {
    export const KIND = "load-diagram";

    export function create(): LoadDiagramAction {
        return {
            kind: KIND,
        };
    }
}

export class LoadDiagramCommand extends Command {
    static readonly KIND = LoadDiagramAction.KIND;

    // After loading a diagram, this command dispatches other actions like fit to screen
    // and optional auto layouting. However when returning a new model in the execute method,
    // the diagram is not directly updated. We need to wait for the
    // InitializeCanvasBoundsCommand to be fired and finish before we can do things like fit to screen.
    // Because of that we block the execution newly dispatched actions including
    // the actions we dispatched after loading the diagram until
    // the InitializeCanvasBoundsCommand has been processed.
    // This works because the canvasBounds property is always removed before loading a diagram,
    // requiring the InitializeCanvasBoundsCommand to be fired.
    readonly blockUntil = LoadDiagramCommand.loadBlockUntilFn;
    static readonly loadBlockUntilFn = (action: Action) => {
        return action.kind === "initializeCanvasBounds";
    };

    @inject(TYPES.ILogger)
    private readonly logger: ILogger = new NullLogger();
    @inject(DynamicChildrenProcessor)
    private readonly dynamicChildrenProcessor: DynamicChildrenProcessor = new DynamicChildrenProcessor();
    @inject(TYPES.IActionDispatcher)
    private readonly actionDispatcher: ActionDispatcher = new ActionDispatcher();
    @inject(LabelTypeRegistry)
    @optional()
    private readonly labelTypeRegistry?: LabelTypeRegistry;

    private oldRoot: SModelRootImpl | undefined;
    private newRoot: SModelRootImpl | undefined;
    private oldLabelTypes: LabelType[] | undefined;
    private newLabelTypes: LabelType[] | undefined;

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        // Open a file picker dialog.
        // The cleaner way to do this would be showOpenFilePicker(),
        // but safari and firefox don't support it at the time of writing this code:
        // https://developer.mozilla.org/en-US/docs/web/api/window/showOpenFilePicker#browser_compatibility
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        const fileLoadPromise = new Promise<SavedDiagram | undefined>((resolve, reject) => {
            // This event is fired when the user successfully submits the file picker dialog.
            input.onchange = () => {
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    const reader = new FileReader();
                    reader.onload = () => {
                        const json = reader.result as string;
                        const model = JSON.parse(json);
                        resolve(model);
                    };
                    reader.onerror = () => {
                        reject(reader.error);
                    };
                    reader.readAsText(file);
                } else {
                    reject("No file selected");
                }
            };
            // The focus event is fired when the file picker dialog is closed.
            // This includes cases where a file was selected and when the dialog was canceled and no file was selected.
            // If a file was selected the change event above is fired after the focus event.
            // So if a file was selected the focus event should be ignored and the promise is resolved in the onchange handler.
            // If the file dialog was canceled undefined should be resolved by the focus handler.
            // Because we don't know whether the change event will follow the focus event,
            // we have a 300ms timeout before resolving the promise.
            // If the promise was already resolved by the onchange handler, this won't do anything.
            window.addEventListener(
                "focus",
                () => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 300);
                },
                { once: true },
            );
        });
        input.click();

        this.oldRoot = context.root;
        try {
            const newDiagram = await fileLoadPromise;
            const newSchema = newDiagram?.model;
            if (!newSchema) {
                this.logger.info(this, "Model loading aborted");
                this.newRoot = this.oldRoot;
                return this.oldRoot;
            }

            // Load sprotty model
            LoadDiagramCommand.preprocessModelSchema(newSchema);
            this.dynamicChildrenProcessor.processGraphChildren(newSchema, "set");
            this.newRoot = context.modelFactory.createRoot(newSchema);

            this.logger.info(this, "Model loaded successfully");

            if (this.labelTypeRegistry) {
                // Load label types
                this.oldLabelTypes = this.labelTypeRegistry.getLabelTypes();
                this.newLabelTypes = newDiagram?.labelTypes;
                this.labelTypeRegistry.clearLabelTypes();
                if (newDiagram?.labelTypes) {
                    newDiagram.labelTypes.forEach((labelType) => {
                        this.labelTypeRegistry?.registerLabelType(labelType);
                    });

                    this.logger.info(this, "Label types loaded successfully");
                }
            }

            postLoadActions(this.newRoot, this.actionDispatcher);
            return this.newRoot;
        } catch (error) {
            this.logger.error(this, "Error loading model", error);
            this.newRoot = this.oldRoot;
            return this.oldRoot;
        }
    }

    /**
     * Before a saved model schema can be loaded, it needs to be preprocessed.
     * Currently this means that the features property is removed from all model elements recursively.
     * Additionally the canvasBounds property is removed from the root element, because it may change
     * depending on browser window.
     * In the future this method may be extended to preprocess other properties.
     *
     * The feature property at runtime is a js Set with the relevant features.
     * E.g. for the top graph this is the viewportFeature among others.
     * When converting js Sets objects into json, the result is an empty js object.
     * When loading the object is converted into an empty js Set and the features are lost.
     * Because of this the editor won't work properly after loading a model.
     * To prevent this, the features property is removed before loading the model.
     * When the features property is missing it gets rebuilt on loading with the currently used features.
     *
     * @param modelSchema The model schema to preprocess
     */
    public static preprocessModelSchema(modelSchema: SModelRoot): void {
        // These properties are all not included in the root typing.
        "features" in modelSchema && delete modelSchema["features"];
        "canvasBounds" in modelSchema && delete modelSchema["canvasBounds"];

        if (modelSchema.children) {
            modelSchema.children.forEach((child: any) => this.preprocessModelSchema(child));
        }
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        this.labelTypeRegistry?.clearLabelTypes();
        this.oldLabelTypes?.forEach((labelType) => this.labelTypeRegistry?.registerLabelType(labelType));
        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        this.labelTypeRegistry?.clearLabelTypes();
        this.newLabelTypes?.forEach((labelType) => this.labelTypeRegistry?.registerLabelType(labelType));
        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}

/**
 * Utility function to fit the diagram to the screen after loading a model inside a command.
 * Captures all element ids and dispatches a FitToScreenAction.
 * Also performs auto layouting if there are unpositioned nodes.
 */
export async function postLoadActions(
    newRoot: SModelRootImpl | undefined,
    actionDispatcher: ActionDispatcher,
): Promise<void> {
    if (!newRoot) {
        return;
    }

    // Layouting:
    const containsUnPositionedNodes = newRoot.children
        .filter((child) => child instanceof SNodeImpl)
        .some((child) => isLocateable(child) && child.position.x === 0 && child.position.y === 0);
    if (containsUnPositionedNodes) {
        await actionDispatcher.dispatch(LayoutModelAction.create());
    }

    // fit to screen is done after auto layouting because that may change the bounds of the diagram
    // requiring another fit to screen.
    await actionDispatcher.dispatch(createDefaultFitToScreenAction(newRoot, false));
}
