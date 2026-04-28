import { AssignmentLanguageTreeBuilder } from "../../src/assignment/language";
import { DfdNodeImpl } from "../../src/diagram/nodes/common";
import { DfdOutputPortImpl } from "../../src/diagram/ports/DfdOutputPort";
import { LabelTypeRegistry } from "../../src/labels/LabelTypeRegistry";
import {
    ValidExpressionTestData,
    AutoCompleteTestData,
    generateTests,
    InvalidExpressionTestData,
    ReplacementTestData,
} from "./LanguageTestUtils";

const BASE_VALID_EXPRESSIONS: ValidExpressionTestData[] = [
    ["forward flow"],
    ["forward hello|world"],
    ["set Sensitivity.Public"],
    ["unset Location.nonEU"],
    ["assign Sensitivity.Public if TRUE from flow"],
    ["assign Sensitivity.Public if TRUE"],
    ["assign Sensitivity.Public if flow.Sensitivity.Public"],
];

const VALID_EXPRESSIONS = [...BASE_VALID_EXPRESSIONS, BASE_VALID_EXPRESSIONS.flat()];

const INVALID_EXPRESSIONS: InvalidExpressionTestData[] = [
    { input: ["forward Sensitivity.Public"] },
    { input: ["set flow"] },
    { input: ["forward hello"] },
    { input: ["set Sensitivity.public"] },
    { input: ["set sensitivity.Public"] },
];

const AUTOCOMPLETE_TEST_DATA: AutoCompleteTestData[] = [
    { input: [""], completionOptions: ["forward", "set", "unset", "assign"], exactOptionCount: true },
    { input: ["forward "], completionOptions: ["flow", "hello|world"], exactOptionCount: true },
    { input: ["set "], completionOptions: ["Sensitivity", "Location"], exactOptionCount: true },
    { input: ["set Sensitivity."], completionOptions: ["Personal", "Public"], exactOptionCount: true },
    { input: ["unset "], completionOptions: ["Sensitivity", "Location"], exactOptionCount: true },
    { input: ["assign "], completionOptions: ["Sensitivity", "Location"] },
    { input: ["assign Sensitivity.Public "], completionOptions: ["if"], exactOptionCount: true },
    { input: ["assign Sensitivity.Public if TRUE "], completionOptions: ["from"] },
];

const REPLACEMENT_TEST_DATA: ReplacementTestData[] = [
    {
        input: ["set Sensitivity.Public"],
        replacement: { old: "Sensitivity.Public", replacement: "Sensitivity.New", type: "label" },
        output: ["set Sensitivity.New"],
    },
];

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

const mockPort = {
    // @ts-expect-error We mock the abstract class into a concrete one for simplicity. TypeScript however still thinks this is an abstract class, so it would throw an error
    parent: new DfdNodeImpl(),
} as unknown as DfdOutputPortImpl;

generateTests(
    "Assignment Language",
    AssignmentLanguageTreeBuilder.buildTree(mockPort, labelTypeRegistry),
    VALID_EXPRESSIONS,
    INVALID_EXPRESSIONS,
    AUTOCOMPLETE_TEST_DATA,
    REPLACEMENT_TEST_DATA,
);
