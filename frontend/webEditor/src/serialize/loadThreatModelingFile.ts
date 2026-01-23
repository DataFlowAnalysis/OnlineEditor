import {
    Command,
    CommandExecutionContext,
    CommandReturn, IActionDispatcher,
    ILogger,
    ISnapper,
    SModelElementImpl,
    SModelRootImpl,
    SNodeImpl,
    TYPES,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry.ts";
import { ConstraintRegistry } from "../constraint/constraintRegistry.ts";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator.ts";
import { chooseFile } from "./fileChooser.ts";
import { inject } from "inversify";
import { ThreatModelingLabelType, ThreatModelingLabelTypeValue } from "../labels/ThreatModelingLabelType.ts";
import { LabelAssignment, LabelType, LabelTypeValue } from "../labels/LabelType.ts";
import { Constraint } from "../constraint/Constraint.ts";
import { getAllElements } from "../labels/assignmentCommand.ts";
import { ContainsDfdLabels, containsDfdLabels } from "../labels/feature.ts";
import { snapPortsOfNode } from "../diagram/ports/portSnapper.ts";
import { DfdOutputPortImpl } from "../diagram/ports/DfdOutputPort.tsx";
import { ResetLabelingProcessAction } from "../labelingProcess/labelingProcessCommand.ts";

// Replaces the type of the `values` of a `LabelType` with a subclass of `LabelTypeValue`
type OverwriteLabelTypeValueType<T extends LabelType, S extends LabelTypeValue> = Omit<T, "values"> & { values: S[] }

type ThreatModelingFileFormat = {
    threatKnowledgeName: string,
    threatKnowledgeVersion: string,
    labels: OverwriteLabelTypeValueType<ThreatModelingLabelType, ThreatModelingLabelTypeValue>[],
    constraints: Constraint[]
}

export namespace LoadThreatModelingFileAction {
    export const KIND = "loadThreatModelingFile";

    export function create(): Action {
        return { kind: KIND };
    }
}

export class LoadThreatModelingFileCommand extends Command {
    static readonly KIND = LoadThreatModelingFileAction.KIND;

    private fileContent: ThreatModelingFileFormat | undefined;

    // UNDO / REDO storage
    private oldLabelTypes: LabelType[] | undefined;
    private oldLabelAssignments: Map<ContainsDfdLabels & SModelElementImpl, LabelAssignment[]> = new Map();
    private oldOutputPortBehavior: Map<DfdOutputPortImpl & SModelElementImpl, string> = new Map();
    private newOutputPortBehavior: Map<DfdOutputPortImpl & SModelElementImpl, string> = new Map();
    private oldConstraints: Constraint[] | undefined;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(TYPES.ILogger) private readonly logger: ILogger,
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) private readonly constraintRegistry: ConstraintRegistry,
        @inject(LoadingIndicator) private readonly loadingIndicator: LoadingIndicator,
        @inject(TYPES.ISnapper) private readonly snapper: ISnapper,
        @inject(TYPES.IActionDispatcher) private readonly actionDispatcher: IActionDispatcher,
    ) {
        super();
    }

    private async getFileContent(): Promise<ThreatModelingFileFormat | undefined> {
        const file = await chooseFile(["application/json"]);
        if (!file) return undefined

        return JSON.parse(file.content) as ThreatModelingFileFormat;
    }

    async execute(context: CommandExecutionContext): Promise<SModelRootImpl> {
        this.loadingIndicator.showIndicator("Loading labels and constraints...");

        const fileContent = await this.getFileContent()
        if (!fileContent) return context.root;

        this.logger.info(this, "File loaded successfully.")
        this.fileContent = fileContent;

        //Import labels
        this.oldLabelTypes = this.labelTypeRegistry.getLabelTypes();
        const newLabelTypes = this.fileContent.labels;
        this.labelTypeRegistry.clearLabelTypes();
        this.labelTypeRegistry.setLabelTypes(newLabelTypes);
        this.logger.info(this, "Label types loaded successfully");

        //Remove all old LabelAssignments
        const allElements = getAllElements(context.root.children);

        const allDfdLabelElements = allElements
            .filter((element) => containsDfdLabels(element));
        allDfdLabelElements.forEach(element => {
            if (element.labels.length > 0) {
                this.oldLabelAssignments.set(element, element.labels);
                element.labels = [];
                if (element instanceof SNodeImpl) {
                    snapPortsOfNode(element, this.snapper);
                }
            }
        });
        this.logger.info(this, "Removed label assignments");

        //Remove OutputPin Behavior except 'forward'
        const allOutputPorts = allElements
            .filter((element) => element instanceof DfdOutputPortImpl)
        allOutputPorts.forEach(outputPort => {
            const outputPortBehavior = outputPort.getBehavior()

            this.oldOutputPortBehavior.set(outputPort, outputPortBehavior);

            //Keep only 'forward' behavior, discard the rest
            const match = outputPortBehavior.match(/^forward\s+\S+(?:\|\S+)*/);
            const newBehavior = match ? match[0] : "";
            this.newOutputPortBehavior.set(outputPort, newBehavior);
            outputPort.setBehavior(newBehavior);
        })
        this.logger.info(this, "Updated output port behavior");


        //Import constraints
        this.oldConstraints = this.constraintRegistry.getConstraintList();
        const newConstraints = this.fileContent.constraints;
        this.constraintRegistry.clearConstraints();
        this.constraintRegistry.setConstraintsFromArray(newConstraints);
        this.logger.info(this, "Constraints loaded successfully");

        //Reset labeling process
        this.actionDispatcher.dispatch(ResetLabelingProcessAction.create())

        this.loadingIndicator.hide();
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (!this.oldLabelTypes || !this.oldConstraints) return context.root;

        // LabelTypes and Labels
        this.labelTypeRegistry.clearLabelTypes();
        this.labelTypeRegistry.setLabelTypes(this.oldLabelTypes);
        this.logger.info(this, "Label types loaded successfully");

        // LabelAssignments
        this.oldLabelAssignments.forEach((labels, element) => {
            element.labels = labels;
            if (element instanceof SNodeImpl) {
                snapPortsOfNode(element, this.snapper);
            }
        });
        this.logger.info(this, "Label assignments restored");

        //OutputPin Behavior
        this.oldOutputPortBehavior.forEach((behavior, outputPort) => {
            outputPort.setBehavior(behavior);
        })
        this.logger.info(this, "Updated output port behavior");

        // Constraints
        this.constraintRegistry.clearConstraints();
        this.constraintRegistry.setConstraintsFromArray(this.oldConstraints);
        this.logger.info(this, "Constraints loaded successfully");

        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        const newLabelTypes = this.fileContent?.labels;
        const newConstraints = this.fileContent?.constraints;
        if (!newLabelTypes || !newConstraints) return context.root;

        // LabelTypes and Labels
        this.labelTypeRegistry.clearLabelTypes();
        this.labelTypeRegistry.setLabelTypes(newLabelTypes);
        this.logger.info(this, "Label types loaded successfully");

        // LabelAssignments
        this.oldLabelAssignments.forEach((_, element) => {
            element.labels = [];
            if (element instanceof SNodeImpl) {
                snapPortsOfNode(element, this.snapper);
            }
        });
        this.logger.info(this, "Label assignments restored");

        //OutputPin Behavior
        this.newOutputPortBehavior.forEach((behavior, outputPort) => {
            outputPort.setBehavior(behavior);
        })
        this.logger.info(this, "Updated output port behavior");

        // Constraints
        this.constraintRegistry.clearConstraints();
        this.constraintRegistry.setConstraintsFromArray(newConstraints);
        this.logger.info(this, "Constraints loaded successfully");

        return context.root;
    }
}