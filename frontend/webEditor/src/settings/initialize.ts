import { EditorModeController } from "./editorMode";
import { HideEdgeNames, SimplifyNodeNames } from "./Settings";

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