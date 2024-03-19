import { inject, injectable } from "inversify";
import { LabelType, LabelTypeRegistry, LabelTypeValue } from "../labels/labelTypeRegistry";
import { ICommandStack, ILogger, SModelElementImpl, SParentElementImpl, TYPES } from "sprotty";
import { DfdOutputPortImpl } from "./ports";

interface LabelTypeChange {
    oldLabelType: LabelType;
    newLabelType: LabelType;
}

interface LabelTypeValueChange {
    labelType: LabelType;
    oldLabelValue: LabelTypeValue;
    newLabelValue: LabelTypeValue;
}

@injectable()
export class DFDBehaviorRefactorListener {
    private previousLabelTypes: LabelType[] = [];

    constructor(
        @inject(LabelTypeRegistry) private readonly registry: LabelTypeRegistry,
        @inject(TYPES.ILogger) private readonly logger: ILogger,
        @inject(TYPES.ICommandStack) private readonly commandStack: ICommandStack,
    ) {
        this.previousLabelTypes = structuredClone(this.registry.getLabelTypes());
        this.registry.onUpdate(() => {
            this.handleRegistryUpdate().catch((error) =>
                this.logger.error(this, "Error while processing label type registry update", error),
            );
        });
    }

    private async handleRegistryUpdate(): Promise<void> {
        this.logger.log(this, "Handling label type registry update");
        const currentLabelTypes = this.registry.getLabelTypes();

        const changedLabelTypes: LabelTypeChange[] = currentLabelTypes.flatMap((currentLabelType) => {
            const previousLabelType = this.previousLabelTypes.find(
                (previousLabelType) => previousLabelType.id === currentLabelType.id,
            );
            if (previousLabelType && previousLabelType.name !== currentLabelType.name) {
                return [{ oldLabelType: previousLabelType, newLabelType: currentLabelType }];
            }
            return [];
        });

        const changedLabelValues: LabelTypeValueChange[] = currentLabelTypes.flatMap((currentLabelType) => {
            const previousLabelType = this.previousLabelTypes.find(
                (previousLabelType) => previousLabelType.id === currentLabelType.id,
            );
            if (!previousLabelType) {
                return [];
            }

            return currentLabelType.values
                .flatMap((newLabelValue) => {
                    const oldLabelValue = previousLabelType.values.find(
                        (oldLabelValue) => oldLabelValue.id === newLabelValue.id,
                    );
                    if (!oldLabelValue) {
                        return [];
                    }

                    return [[oldLabelValue, newLabelValue]];
                })
                .filter(([oldLabelValue, newLabelValue]) => oldLabelValue.text !== newLabelValue?.text)
                .map(([oldLabelValue, newLabelValue]) => ({
                    labelType: currentLabelType,
                    oldLabelValue,
                    newLabelValue,
                }));
        });

        this.logger.log(this, "Changed label types", changedLabelTypes);
        this.logger.log(this, "Changed label values", changedLabelValues);

        const model = await this.commandStack.executeAll([]);
        this.traverseDfdOutputPorts(model, (port) => {
            this.processPort(port, changedLabelTypes, changedLabelValues);
        });

        this.previousLabelTypes = structuredClone(currentLabelTypes);
    }

    private traverseDfdOutputPorts(element: SModelElementImpl, cb: (port: DfdOutputPortImpl) => void) {
        if (element instanceof DfdOutputPortImpl) {
            cb(element);
        }

        if (element instanceof SParentElementImpl) {
            element.children.forEach((child) => this.traverseDfdOutputPorts(child, cb));
        }
    }

    private processPort(
        port: DfdOutputPortImpl,
        changedLabelTypes: LabelTypeChange[],
        changedLabelValues: LabelTypeValueChange[],
    ): void {
        const behaviorLines = port.behavior.split("\n");
        const newBehaviorLines = behaviorLines.map((line) => {
            if (!line.startsWith("set")) {
                return line;
            }

            // replace the old label type with the new one using a regex (\.?oldLabelType\.)
            // and ensure before it is a non alphanumeric character.
            // Otherwise it could replace a substring when a type has the same ending as another type.
            // Also ensure after it is a dot because after a label type there is always a dot to access the value of the label.
            let newLine = line;
            changedLabelTypes.forEach((changedLabelType) => {
                newLine = newLine.replace(
                    new RegExp(`([^a-zA-Z0-9])${changedLabelType.oldLabelType.name}(\.)`, "g"),
                    `$1${changedLabelType.newLabelType.name}$2`,
                );
            });

            // replace the old label value with the new one using a regex (oldLabelType\.oldLabelValue)
            // and ensure before and after it is a non alphanumeric character or the end of the line.
            // Otherwise it could replace a substring when a value has the same beginning as another value
            // or the type has the same ending as another type
            changedLabelValues.forEach((changedLabelValue) => {
                newLine = newLine.replace(
                    new RegExp(
                        `([^a-zA-Z0-9])${changedLabelValue.labelType.name}\.${changedLabelValue.oldLabelValue.text}([^a-zA-Z0-9]|$)`,
                        "g",
                    ),
                    `$1${changedLabelValue.labelType.name}.${changedLabelValue.newLabelValue.text}$2`,
                );
            });

            return newLine;
        });

        port.behavior = newBehaviorLines.join("\n");
    }
}
