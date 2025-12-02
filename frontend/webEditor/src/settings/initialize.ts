import { IActionDispatcher } from "sprotty";
import { EditorModeController } from "./editorMode";
import { HideEdgeNames, SimplifyNodeNames } from "./Settings";
import { HideEdgeNamesAction } from "./hideEdgeNames";
import { SimplifyNodeNamesAction } from "./simplifyNodeNames";

export function linkReadOnly(
  editorModeController: EditorModeController,
  simplifyNodeNames: SimplifyNodeNames,
  hideEdgeNames: HideEdgeNames
): void {
  editorModeController.registerListener(() => {
    if(!editorModeController.isReadOnly()) {
      simplifyNodeNames.set(false);
      hideEdgeNames.set(false);
    }
  });

  simplifyNodeNames.registerListener((newValue) => {
    if(newValue) {
      editorModeController.set("view");
    }
  });
  hideEdgeNames.registerListener((newValue) => {
    if(newValue) {
      editorModeController.set("view");
    }
  });
}

export function addCommands(
  actionDispatcher: IActionDispatcher,
  simplifyNodeNames: SimplifyNodeNames,
  hideEdgeNames: HideEdgeNames
) {
  hideEdgeNames.registerListener(() => actionDispatcher.dispatch(HideEdgeNamesAction.create()))
  simplifyNodeNames.registerListener(() => actionDispatcher.dispatch(SimplifyNodeNamesAction.create()))
}