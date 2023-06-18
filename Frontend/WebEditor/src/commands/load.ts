import { inject } from "inversify";
import { Command, CommandExecutionContext, EMPTY_ROOT, ILogger, NullLogger, SModelRoot, TYPES } from "sprotty";
import { Action, SModelRoot as SModelRootSchema } from "sprotty-protocol";

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
    @inject(TYPES.ILogger)
    private logger: ILogger = new NullLogger();
    private oldRoot: SModelRoot | undefined;
    private newRoot: SModelRoot | undefined;

    async execute(context: CommandExecutionContext): Promise<SModelRoot> {
        // Open a file picker dialog.
        // The cleaner way to do this would be showOpenFilePicker(),
        // but safari and firefox don't support it at the time of writing this code:
        // https://developer.mozilla.org/en-US/docs/web/api/window/showOpenFilePicker#browser_compatibility
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        const fileLoadPromise = new Promise<SModelRootSchema>((resolve, reject) => {
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
        });
        input.click();

        this.oldRoot = context.root;
        try {
            const newSchema = await fileLoadPromise;
            this.preprocessModelSchema(newSchema);
            this.newRoot = context.modelFactory.createRoot(newSchema);

            this.logger.info(this, "Model loaded successfully");
            return this.newRoot;
        } catch (error) {
            this.logger.error(this, "Error loading model", error);
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
