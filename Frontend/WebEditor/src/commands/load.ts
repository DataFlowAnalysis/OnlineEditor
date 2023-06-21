import { inject } from "inversify";
import { Command, CommandExecutionContext, EMPTY_ROOT, ILogger, NullLogger, SModelRoot, TYPES } from "sprotty";
import { Action, SModelRoot as SModelRootSchema } from "sprotty-protocol";
import { constructorInject } from "../utils";
import { ExpanderModelSource } from "../modelSource";

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

    private oldRoot: SModelRoot | undefined;
    private newRoot: SModelRoot | undefined;

    constructor(
        @constructorInject(TYPES.ILogger) private readonly logger: ILogger,
        @constructorInject(TYPES.ModelSource) private readonly modelSource: ExpanderModelSource,
    ) {
        super();
    }

    async execute(context: CommandExecutionContext): Promise<SModelRoot> {
        // Open a file picker dialog.
        // The cleaner way to do this would be showOpenFilePicker(),
        // but safari and firefox don't support it at the time of writing this code:
        // https://developer.mozilla.org/en-US/docs/web/api/window/showOpenFilePicker#browser_compatibility
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        const fileLoadPromise = new Promise<SModelRootSchema | undefined>((resolve, reject) => {
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
            const newSchema = await fileLoadPromise;
            if (!newSchema) {
                this.logger.info(this, "Model loading aborted");
                this.newRoot = this.oldRoot;
                return this.oldRoot;
            }

            this.preprocessModelSchema(newSchema);
            this.modelSource.processGraph(newSchema, "expand");
            this.newRoot = context.modelFactory.createRoot(newSchema);

            this.logger.info(this, "Model loaded successfully");
            return this.newRoot;
        } catch (error) {
            this.logger.error(this, "Error loading model", error);
            this.newRoot = this.oldRoot;
            return this.oldRoot;
        }
    }

    /**
     * Before a saved model schema can be loaded, it needs to be preprocessed.
     * Currently this means that the features property is removed from all model elements recursively,
     * but in the future more thing may be added here.
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
    private preprocessModelSchema(modelSchema: SModelRootSchema): void {
        // Feature is not included in the typing
        "features" in modelSchema && delete modelSchema["features"];

        if (modelSchema.children) {
            modelSchema.children.forEach((child: any) => this.preprocessModelSchema(child));
        }
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.newRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}
