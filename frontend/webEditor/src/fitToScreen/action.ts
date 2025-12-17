import { SModelRootImpl } from "sprotty";
import { SModelRoot, FitToScreenAction, getBasicType } from "sprotty-protocol";

export const FIT_TO_SCREEN_PADDING = 75;

export namespace DefaultFitToScreenAction {
    export function create(root: SModelRootImpl | SModelRoot, animate = true): FitToScreenAction {
        const elementIds =
            root.children?.filter((child) => getBasicType(child) === "node").map((child) => child.id) ?? [];

        return FitToScreenAction.create(elementIds, {
            padding: FIT_TO_SCREEN_PADDING,
            animate,
        });
    }
}
