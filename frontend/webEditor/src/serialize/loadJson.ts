import { ActionDispatcher, Command, CommandExecutionContext, CommandReturn, EMPTY_ROOT, ILogger, SModelRootImpl } from "sprotty";
import { SavedDiagram } from "./SavedDiagram";
import { Action, SModelElement, SModelRoot } from "sprotty-protocol";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { EditorModeController, EditorMode } from "../settings/editorMode";
import { Constraint } from "../constraint/Constraint";
import { LabelType } from "../labels/LabelType";
import { DefaultFitToScreenAction } from "../fitToScreen/action";
import { FileName } from "../fileName/fileName";

export interface FileData<T> {
    fileName: string;
    content: T;
}

export abstract class LoadJsonCommand extends Command {
    /* After loading a diagram, this command dispatches other actions like fit to screen and optional auto layouting. However when returning a new model in the execute method, the diagram is not directly updated. We need to wait for the InitializeCanvasBoundsCommand to be fired and finish before we can do things like fit to screen.
    Because of that we block the execution newly dispatched actions including the actions we dispatched after loading the diagram until the InitializeCanvasBoundsCommand has been processed.
    This works because the canvasBounds property is always removed  loading a diagram, requiring the InitializeCanvasBoundsCommand to be fired. */
    readonly blockUntil = LoadJsonCommand.loadBlockUntilFn;
    static readonly loadBlockUntilFn = (action: Action) => {
        return action.kind === "initializeCanvasBounds";
    };

    private oldRoot: SModelRootImpl | undefined;
    private newRoot: SModelRootImpl | undefined;
    private oldLabelTypes: LabelType[] | undefined;
    private oldEditorMode: EditorMode | undefined;
    private oldFileName: string | undefined;
    private oldConstrains: Constraint[] | undefined;
    private file: FileData<SavedDiagram> | undefined;

    constructor(
        private readonly logger: ILogger,
        protected readonly labelTypeRegistry: LabelTypeRegistry,
        protected editorModeController: EditorModeController,
        private actionDispatcher: ActionDispatcher,
        protected fileName: FileName
    ) {
        super();
    }

    protected abstract getFile(context: CommandExecutionContext): Promise<FileData<SavedDiagram> | undefined>;

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        this.oldRoot = context.root;

        this.file = await this.getFile(context).catch(() => undefined);
        if (!this.file) {
            return context.root;
        }

        try {
            const newSchema = LoadJsonCommand.preprocessModelSchema(this.file.content.model);
            this.newRoot = context.modelFactory.createRoot(newSchema);

            this.logger.info(this, "Model loaded successfully");

            this.oldLabelTypes = this.labelTypeRegistry.getLabelTypes();
            const newLabelTypes = this.file.content.labelTypes;
            this.labelTypeRegistry.clearLabelTypes();
            if (newLabelTypes) {
                this.labelTypeRegistry.setLabelTypes(newLabelTypes);
                this.logger.info(this, "Label types loaded successfully");
            } else {
                this.labelTypeRegistry.clearLabelTypes();
            }

            this.oldEditorMode = this.editorModeController.get();
            const newEditorMode = this.file.content.mode;
            if (newEditorMode) {
                this.editorModeController.set(newEditorMode);
            } else {
                this.editorModeController.setDefault();
            }
            this.logger.info(this, "Editor mode loaded successfully");

            // TODO: load constraints

            // TODO: post load actions like layout
            this.actionDispatcher.dispatch(DefaultFitToScreenAction.create(this.newRoot))

            this.oldFileName = this.fileName.getName();
            this.fileName.setName(this.file.fileName);

            return this.newRoot;
        } catch (error) {
            this.logger.error(this, "Error loading model", error);
            this.newRoot = this.oldRoot;
            return this.oldRoot;
        }
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.oldLabelTypes) {
            this.labelTypeRegistry.setLabelTypes(this.oldLabelTypes);
        } else {
            this.labelTypeRegistry.clearLabelTypes();
        }

        if (this.oldEditorMode) {
            this.editorModeController.set(this.oldEditorMode);
        } else {
            this.editorModeController.setDefault();
        }

        if (this.oldEditorMode) {
            this.editorModeController.set(this.oldEditorMode);
        }

        // TODO: load constraints

        this.fileName.setName(this.oldFileName ?? 'diagram');

        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): CommandReturn {
        const newLabelTypes = this.file?.content.labelTypes;
        this.labelTypeRegistry.clearLabelTypes();
        if (newLabelTypes) {
            this.labelTypeRegistry.setLabelTypes(newLabelTypes);
            this.logger.info(this, "Label types loaded successfully");
        } else {
            this.labelTypeRegistry.clearLabelTypes();
        }

        const newEditorMode = this.file?.content.mode;
        if (newEditorMode) {
            this.editorModeController.set(newEditorMode);
        } else {
            this.editorModeController.setDefault();
        }
        this.logger.info(this, "Editor mode loaded successfully");

        // TODO: load constraints

        this.fileName.setName(this.file?.fileName ?? 'diagram');

        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
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
    private static preprocessModelSchema(modelSchema: SModelRoot): SModelRoot {
        // These properties are all not included in the root typing and if present are not loaded and handled correctly. So they are removed.
        if ("features" in modelSchema) {
            delete modelSchema["features"];
        }
        if ("canvasBounds" in modelSchema) {
            delete modelSchema["canvasBounds"];
        }

        if (modelSchema.children) {
            modelSchema.children.forEach((child: SModelElement) => this.preprocessModelSchema(child));
        }
        return modelSchema;
    }
}
