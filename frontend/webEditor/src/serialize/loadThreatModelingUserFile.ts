import { LoadThreatModelingFileCommand } from "./loadThreatModelingFile.ts";
import { Action } from "sprotty-protocol";

export namespace LoadThreatModelingUserFileAction {
    export const KIND = "loadThreatModelingUserFile";

    export function create(): Action {
        return { kind: KIND };
    }
}

export class LoadThreatModelingUserFileCommand extends LoadThreatModelingFileCommand {
    static readonly KIND = LoadThreatModelingUserFileAction.KIND;
}