import { CommandExecutionContext, TYPES } from "sprotty";
import { FileData } from "./loadJson";
import { SaveFileCommand } from "./saveFile";
import { EditorModeController } from "../settings/editorMode";
import { inject } from "inversify";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { Action } from "sprotty-protocol";
import { FileName } from "../fileName/fileName";
import { SETTINGS } from "../settings/Settings";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { getAllElements } from "../labels/assignmentCommand.ts";
import { DfdNodeImpl } from "../diagram/nodes/common.ts";
import { DfdNodeAnnotation } from "../annotation/DFDNodeAnnotation.ts";

const CSV_COLUMN_SEPARATOR = ","
const CSV_LINE_SEPARATOR = "\n"

export namespace SaveThreatsTableAction {
    export const KIND = "saveThreatsTable";
    export function create(): Action {
        return { kind: KIND };
    }
}

export class SaveThreatsTableCommand extends SaveFileCommand {
    static readonly KIND = SaveThreatsTableAction.KIND;

    constructor(
        @inject(TYPES.Action) _: Action,
        @inject(LabelTypeRegistry) LabelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(FileName) private readonly fileName: FileName,
        @inject(LoadingIndicator) loadingIndicator: LoadingIndicator,
    ) {
        super(LabelTypeRegistry, constraintRegistry, editorModeController, loadingIndicator);
    }

    getFiles(context: CommandExecutionContext): Promise<FileData<string>[]> {
        const allDfdNodeElements = getAllElements(context.root.children)
            .filter((elem) => elem instanceof DfdNodeImpl);

        const toExport: { nodeId: string; nodeText: string; violatedConstraint: string }[] = [];
        for (const dfdNode of allDfdNodeElements) {
            for (const annotation of dfdNode.annotations) {
                if (!SaveThreatsTableCommand.isViolation(annotation)) {
                    continue;
                }

                toExport.push({
                    nodeId: dfdNode.id,
                    nodeText: dfdNode.text,
                    violatedConstraint: this.extractViolatedConstraintFromMessage(annotation.message),
                });
            }
        }

        const fileData: FileData<string> = {
            fileName: this.fileName.getName() + ".csv",
            content: SaveThreatsTableCommand.toCSV(toExport),
        };
        return Promise.resolve([fileData]);
    }

    private static isViolation(annotation: DfdNodeAnnotation): boolean {
        return annotation.message.includes("violated");
    }

    private extractViolatedConstraintFromMessage(message: string): string {
        return message
            .replace("Constraint ", "")
            .replace(" violated", "")
    }

    private static toCSV<T extends object>(array: T[]): string {
        let csv = ""

        if (array.length == 0) return csv;

        //Header
        for (const headerEntry of Object.keys(array[0])) {
            csv += SaveThreatsTableCommand.escapeCSVEntry(headerEntry)
            csv += CSV_COLUMN_SEPARATOR
        }
        csv += CSV_LINE_SEPARATOR

        //Content
        for (const row of array) {
            for (const entry of Object.values(row)) {
                csv += SaveThreatsTableCommand.escapeCSVEntry(entry)
                csv += CSV_COLUMN_SEPARATOR
            }
            csv += CSV_LINE_SEPARATOR
        }

        return csv
    }

    private static escapeCSVEntry(value: unknown): string {
        if (value == null) return "";

        const str = String(value)
        if (/[",\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }

        return str;
    }
}
