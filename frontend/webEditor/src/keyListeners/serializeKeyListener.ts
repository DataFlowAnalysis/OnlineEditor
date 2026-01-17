import { injectable } from "inversify";
import { KeyListener, SModelElementImpl, CommitModelAction } from "sprotty";
import { Action } from "sprotty-protocol";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";
import { LoadDefaultDiagramAction } from "../serialize/loadDefaultDiagram";
import { LoadJsonFileAction } from "../serialize/loadJsonFile";
import { SaveJsonFileAction } from "../serialize/saveJsonFile";
import { AnalyzeAction } from "../serialize/analyze";

@injectable()
export class SerializeKeyListener extends KeyListener {
    keyDown(_element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, "KeyO", "ctrlCmd")) {
            // Prevent the browser file open dialog from opening
            event.preventDefault();

            return [LoadJsonFileAction.create(), CommitModelAction.create()];
        } else if (matchesKeystroke(event, "KeyO", "ctrlCmd", "shift")) {
            event.preventDefault();
            return [LoadDefaultDiagramAction.create(), CommitModelAction.create()];
        } else if (matchesKeystroke(event, "KeyS", "ctrlCmd")) {
            event.preventDefault();
            return [SaveJsonFileAction.create()];
        } else if (matchesKeystroke(event, "KeyA", "ctrlCmd", "shift")) {
            event.preventDefault();
            return [AnalyzeAction.create(), CommitModelAction.create()];
        }

        return [];
    }
}
