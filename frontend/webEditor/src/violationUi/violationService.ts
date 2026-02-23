import { injectable } from "inversify";
import { Violation } from "../serialize/SavedDiagram";

@injectable()
export class ViolationService {
    private violations: Violation[] = [];
    private listeners: ((violations: Violation[]) => void)[] = [];

    updateViolations(newViolations: Violation[]) {
        this.violations = newViolations;
        this.listeners.forEach((callback) => callback(this.violations));
    }

    onViolationsChanged(callback: (violations: Violation[]) => void) {
        this.listeners.push(callback);
    }

    getViolations() {
        return this.violations;
    }
}
