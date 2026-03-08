import { injectable, inject } from "inversify";
import { ViolationService } from "./violationService";
import "./violationUi.css";
import { AccordionUiExtension } from "../accordionUiExtension";
import { Violation } from "./Violation";

@injectable()
export class ViolationUI extends AccordionUiExtension {
    static readonly ID = "violation-ui";

    constructor(@inject(ViolationService) private violationService: ViolationService) {
        super("left", "up");
    }

    id() {
        return ViolationUI.ID;
    }

    containerClass() {
        return ViolationUI.ID;
    }

    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.innerText = "Violation Summary";
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        contentElement.innerHTML = `
            <div class="violation-content">
                <div id="simple-summary">
                    <div class="summary-text">
                        <p class="status-info">
                            No violation data found. Run an Analysis first.
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.violationService.onViolationsChanged((violations) => {
            this.updateSimpleTab(contentElement, violations);
        });
    }

    private updateSimpleTab(container: HTMLElement, violations: Violation[]) {
        const simplePane = container.querySelector("#simple-summary .summary-text");
        if (!simplePane) return;

        if (violations.length === 0) {
            simplePane.innerHTML = `<p class="status-info">No violations found. Everything looks good!</p>`;
            return;
        }

        const listItems = violations
            .map(
                (v) => `
            <div class="violation-item">
                <table class="violation-table">
                    <tr>
                        <td>Constraint</td>
                        <td>${v.constraint}</td>
                    </tr>
                    <tr>
                        <td>Violation in</td>
                        <td>${v.violatedVertices}</td>
                    </tr>
                    <tr>
                        <td>Induced by</td>
                        <td>${v.inducingVertices}</td>
                    </tr>
                    <tr>
                        <td>Flow Cause</td>
                        <td>${v.tfg}</td>
                    </tr>
                </table>
            </div>
        `,
            )
            .join("");

        simplePane.innerHTML = `
            <div class="violation-list">${listItems}</div>
        `;
    }
}