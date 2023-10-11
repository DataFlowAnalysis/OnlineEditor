import { injectable } from "inversify";
import { CenterGridSnapper, ISnapper, MoveMouseListener, SModelElementImpl, SPortImpl, isBoundsAware } from "sprotty";
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

/**
 * A snapper that snaps ports to be on top of the nearest edge of the node.
 * For nodes this snapper uses a grid with a grid size of 5 while for ports it uses a grid size of 2
 * to allow for more precise positioning of ports.
 */
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

        // The position currently points exactly on the edge.
        // This position is used as the top left point when the port is drawn.
        // However we want the port to be centered on the node edge instead of the top left being on top of the edge.
        // So we move the port by half of the width/height to the left/top to center it on the node edge.
        const snappedX = closestEdge.x - element.bounds.width / 2;
        const snappedY = closestEdge.y - element.bounds.height / 2;

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

/**
 * Custom MoveMouseListener that only allows to disable snapping for nodes.
 * For use with PortAwareSnapper which snaps the ports to the node edges.
 * Snapping can normally be temporarily disabled by holding down the Shift key.
 * This would allow you to move a port to any position in the diagram and not just on the node edges.
 * This is not wanted why we disallow fine moving without snapping for ports.
 */
export class AlwaysSnapPortsMoveMouseListener extends MoveMouseListener {
    protected snap(position: Point, element: SModelElementImpl, isSnap: boolean): Point {
        // Snap if it is active or always for ports
        if (this.snapper && (isSnap || element instanceof SPortImpl)) {
            return this.snapper.snap(position, element);
        } else {
            return position;
        }
    }
}
