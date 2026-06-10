import { LocalModelSource } from "sprotty";
import { ConstraintDslTreeBuilder } from "../../src/constraint/language";
import { LabelTypeRegistry } from "../../src/labels/LabelTypeRegistry";
import {
    ValidExpressionTestData,
    AutoCompleteTestData,
    generateTests,
    InvalidExpressionTestData,
    ReplacementTestData,
} from "./LanguageTestUtils";


const VALID_EXPRESSIONS: ValidExpressionTestData[] = [
    ["- Test: data Sensitivity.Personal neverFlows vertex Location.nonEU"],
    ["- Auth_request: data Sensitivity.Personal,Location.EU neverFlows vertex !Location.EU"],
    ["- test: data Sensitivity.Personal neverFlows"],
    ["- Test: data Sensitivity.Personal", "    neverFlows", "    vertex Location.nonEU"],
];

const INVALID_EXPRESSIONS: InvalidExpressionTestData[] = [
    { input: ["- data Sensitivity.Personal neverFlows vertex Location.nonEU"] },
    { input: ["- Test: data Sensitivity.Personal vertex Location.nonEU"] }
];

const AUTOCOMPLETE_TEST_DATA: AutoCompleteTestData[] = [
    { input: ["- Test: "], completionOptions: ["data", "vertex"], exactOptionCount: true },
    { input: ["- Test: data "], completionOptions: ["Sensitivity", "named", "Location", "type"] },
    { input: ["- Test: data Sensitivity.Personal "], completionOptions: ["neverFlows", "vertex"] },
    { input: ["- Test: data Sensitivity.Personal neverFlows "], completionOptions: ["where", "vertex"] },
    { input: ["- Test: data Sensitivity.Personal neverFlows vertex Location."], completionOptions: ["EU", "nonEU"] }
];

const REPLACEMENT_TEST_DATA: ReplacementTestData[] = [{
        input: ["- Test: data Sensitivity.Personal neverFlows vertex Location.nonEU"],
        replacement: { old: "Sensitivity.Personal", replacement: "Sensitivity.New", type: "label" },
        output: ["- Test: data Sensitivity.New neverFlows vertex Location.nonEU"],
    }];

const labelTypeRegistry = new LabelTypeRegistry();
const location = labelTypeRegistry.registerLabelType("Location");
for (const defaultValue of location.values) {
    labelTypeRegistry.unregisterLabelTypeValue(location.id, defaultValue.id);
}
labelTypeRegistry.registerLabelTypeValue(location.id, "EU");
labelTypeRegistry.registerLabelTypeValue(location.id, "nonEU");
const sensitivity = labelTypeRegistry.registerLabelType("Sensitivity");
for (const defaultValue of sensitivity.values) {
    labelTypeRegistry.unregisterLabelTypeValue(sensitivity.id, defaultValue.id);
}
labelTypeRegistry.registerLabelTypeValue(sensitivity.id, "Personal");
labelTypeRegistry.registerLabelTypeValue(sensitivity.id, "Public");

const mockModel = {
} as unknown as LocalModelSource;

generateTests(
    "Simple Constraint Language",
    ConstraintDslTreeBuilder.buildTree(mockModel, labelTypeRegistry),
    VALID_EXPRESSIONS,
    INVALID_EXPRESSIONS,
    AUTOCOMPLETE_TEST_DATA,
    REPLACEMENT_TEST_DATA,
);
