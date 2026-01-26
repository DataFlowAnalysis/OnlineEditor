import { injectable } from "inversify";
import { ICommandPaletteActionProvider, LabeledAction, SModelRootImpl, CommitModelAction } from "sprotty";
import { LoadDefaultDiagramAction } from "../serialize/loadDefaultDiagram";
import { LoadJsonFileAction } from "../serialize/loadJsonFile";
import { Action } from "sprotty-protocol";
import { LoadDfdAndDdFileAction } from "../serialize/loadDfdAndDdFile";
import { LoadPalladioFileAction } from "../serialize/loadPalladioFile";
import { DefaultFitToScreenAction } from "../fitToScreen/action";
import { LayoutMethod } from "../layout/layoutMethod";
import { LayoutModelAction } from "../layout/command";
import { SaveJsonFileAction } from "../serialize/saveJsonFile";
import { SaveDfdAndDdFileAction } from "../serialize/saveDfdAndDdFile";
import { SaveThreatsTableAction } from "../serialize/saveThreatsTable.ts";
import { LoadThreatModelingUserFileAction } from "../serialize/loadThreatModelingUserFile.ts";
import { LoadThreatModelingLinddunFileAction } from "../serialize/loadThreatModelingLinddunFile.ts";

/**
 * Provides possible actions for the command palette.
 */
@injectable()
export class WebEditorCommandPaletteActionProvider implements ICommandPaletteActionProvider {
    async getActions(root: Readonly<SModelRootImpl>): Promise<(LabeledAction | FolderAction)[]> {
        const fitToScreenAction = DefaultFitToScreenAction.create(root);
        const commitAction = CommitModelAction.create();

        return [
            new FolderAction(
                "Load",
                [
                    new LabeledAction("Load diagram from JSON", [LoadJsonFileAction.create(), commitAction], "json"),
                    new LabeledAction("Load DFD and DD", [LoadDfdAndDdFileAction.create(), commitAction], "coffee"),
                    new LabeledAction(
                        "Load Palladio",
                        [LoadPalladioFileAction.create(), commitAction],
                        "fa-puzzle-piece",
                    ),
                    new LabeledAction(
                        "Load Threat Modeling File (JSON)",
                        [LoadThreatModelingUserFileAction.create(), commitAction],
                        "fa-triangle-exclamation"
                    ),
                    new LabeledAction(
                        "Load LINDDUN Threat Modeling File",
                        [LoadThreatModelingLinddunFileAction.create(), commitAction],
                        "fa-triangle-exclamation"
                    ),
                ],
                "go-to-file",
            ),
            new FolderAction(
                "Save",
                [
                    new LabeledAction("Save diagram as JSON", [SaveJsonFileAction.create()], "json"),
                    new LabeledAction("Save diagram as DFD and DD", [SaveDfdAndDdFileAction.create()], "coffee"),
                    //new LabeledAction("Save viewport as image", [SaveImageAction.create()], "device-camera"),
                    new LabeledAction("Save threats table", [SaveThreatsTableAction.create()], "fa-triangle-exclamation")
                ],
                "save",
            ),

            new LabeledAction("Load default diagram", [LoadDefaultDiagramAction.create(), commitAction], "clear-all"),
            new LabeledAction("Fit to Screen", [fitToScreenAction], "screen-normal"),
            new FolderAction(
                "Layout diagram (Method: Lines)",
                [
                    new LabeledAction(
                        "Layout: Lines",
                        [LayoutModelAction.create(LayoutMethod.LINES), commitAction, fitToScreenAction],
                        "grabber",
                    ),
                    new LabeledAction(
                        "Layout: Wrapping Lines",
                        [LayoutModelAction.create(LayoutMethod.WRAPPING), commitAction, fitToScreenAction],
                        "word-wrap",
                    ),
                    new LabeledAction(
                        "Layout: Circles",
                        [LayoutModelAction.create(LayoutMethod.CIRCLES), commitAction, fitToScreenAction],
                        "circle-large",
                    ),
                ],
                "layout",
                [LayoutModelAction.create(LayoutMethod.LINES), commitAction, fitToScreenAction],
            ),
        ];
    }
}

export class FolderAction extends LabeledAction {
    constructor(
        label: string,
        readonly children: LabeledAction[],
        icon?: string,
        actions: Action[] = [],
    ) {
        super(label, actions, icon);
    }
}
