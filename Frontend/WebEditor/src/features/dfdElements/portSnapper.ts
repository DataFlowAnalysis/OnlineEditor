import { injectable } from "inversify";
import { CenterGridSnapper, ISnapper, SModelElementImpl, SPortImpl, isBoundsAware } from "sprotty";
import { Point } from "sprotty-protocol";

/**
 * A grid snapper that snaps to the nearest grid point.
 * Same as CenterGridSnapper but allows to specify the grid size at construction time.
 */
class ConfigurableGridSnapper extends CenterGridSnapper {
    constructor(private readonly gridSize: number) {
        super();
    }

    override get gridX() {
        return this.gridSize;
    }

    override get gridY() {
        return this.gridSize;
    }
}

@injectable()
export class PortAwareSnapper implements ISnapper {
    private readonly nodeSnapper = new ConfigurableGridSnapper(5);
    private readonly portSnapper = new ConfigurableGridSnapper(2);

    private snapPort(position: Point, element: SPortImpl): Point {
        const parentElement = element.parent;

        if (!isBoundsAware(parentElement)) {
            // Cannot get the parent size, just return the original position and don't snap
            return position;
        }

        const parentBounds = parentElement.bounds;

        // Clamp the position to be inside the parent bounds
        const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

        position = this.portSnapper.snap(position, element);
        const clampX = clamp(position.x, 0, parentBounds.width);
        const clampY = clamp(position.y, 0, parentBounds.height);

        // Determine the closest edge
        const distances = [
            { x: clampX, y: 0 }, // Top edge
            { x: 0, y: clampY }, // Left edge
            { x: parentBounds.width, y: clampY }, // Right edge
            { x: clampX, y: parentBounds.height }, // Bottom edge
        ];

        const closestEdge = distances.reduce((prev, curr) =>
            Math.hypot(curr.x - position.x, curr.y - position.y) < Math.hypot(prev.x - position.x, prev.y - position.y)
                ? curr
                : prev,
        );

        // Move the port from being on top of the edge on the side of the edge.
        // Before this step x and y are the point of the top left point of the port inside the parent element.
        // After this step the port will be moved on the side of the edge.
        // So if it is on the top edge it will be above the edge and contact it at the bottom.
        // If it is on the left edge it will be on the left of the edge and contact it on the right.
        // For bottom and right we don't need to do anything because the port is already on the side of the edge.
        // The movement is scaled by the position to make a smooth transition in the four corners possible.
        const snappedX = closestEdge.x - element.bounds.width * (1 - closestEdge.x / parentBounds.width);
        const snappedY = closestEdge.y - element.bounds.height * (1 - closestEdge.y / parentBounds.height);

        return { x: snappedX, y: snappedY };
    }

    snap(position: Point, element: SModelElementImpl): Point {
        if (element instanceof SPortImpl) {
            return this.snapPort(position, element);
        } else {
            return this.nodeSnapper.snap(position, element);
        }
    }
}
