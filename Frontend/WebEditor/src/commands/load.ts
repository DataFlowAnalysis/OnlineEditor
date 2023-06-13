import { inject } from "inversify";
import { Command, CommandExecutionContext, ILogger, LocalModelSource, NullLogger, SModelRoot, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";

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
    @inject(TYPES.ModelSource)
    private modelSource: LocalModelSource = new LocalModelSource();
    @inject(TYPES.ILogger)
    private logger: ILogger = new NullLogger();

    constructor() {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        // Open a file picker dialog.
        // The cleaner way to do this would be showOpenFilePicker(),
        // but safari and firefox don't support it at the time of writing this code:
        // https://developer.mozilla.org/en-US/docs/web/api/window/showOpenFilePicker#browser_compatibility
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        const fileLoadPromise = new Promise((resolve, reject) => {
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

        fileLoadPromise
            .then((model: any) => {
                // TODO: document, move to dedicated class method
                const removeFeatures = (model: any) => {
                    delete model.features;
                    if (model.children) {
                        model.children.forEach((child: any) => removeFeatures(child));
                    }
                };
                removeFeatures(model);

                return this.modelSource.setModel(model);
            })
            .then(() => {
                this.logger.info(this, "Model loaded successfully");
            })
            .catch((error) => {
                this.logger.error(this, "Error loading model", error);
            });

        return context.root;
    }

    // TODO: undo and redo implementation
    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }
}
