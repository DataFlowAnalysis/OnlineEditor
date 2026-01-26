import { Action } from "sprotty-protocol";
import { LoadThreatModelingFileCommand, ThreatModelingFileFormat } from "./loadThreatModelingFile.ts";
import LINDDUN from './linddun.json'

export namespace LoadThreatModelingLinddunFileAction {
    export const KIND = "LoadThreatModelingLINDDUNFile";

    export function create(): Action {
        return { kind: KIND };
    }
}

export class LoadThreatModelingLinddunFileCommand extends LoadThreatModelingFileCommand {
    static readonly KIND = LoadThreatModelingLinddunFileAction.KIND;

    override async getFileContent(): Promise<ThreatModelingFileFormat | undefined> {
        return LINDDUN as ThreatModelingFileFormat;
    }
}