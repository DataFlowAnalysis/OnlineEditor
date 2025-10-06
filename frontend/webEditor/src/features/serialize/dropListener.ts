import { inject, injectable } from "inversify";
import { ILogger, MouseListener, SModelElementImpl, TYPES } from "sprotty";
import { LoadDiagramAction } from "./load";
import { Action } from "sprotty-protocol";

@injectable()
export class SerializeDropHandler extends MouseListener {
    constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {
        super();
    }

    drop(_target: SModelElementImpl, ev: DragEvent): (Action | Promise<Action>)[] {
        this.logger.log(this, "Drop event detected", ev);

        // Prevent default behavior which would open the file in the browser
        ev.preventDefault();

        const file = ev.dataTransfer?.files[0];
        if (!file) {
            return [];
        }

        if (file.type !== "application/json") {
            alert("Diagram file must be in JSON format");
            return [];
        }

        return [LoadDiagramAction.create(file)];
    }
}
