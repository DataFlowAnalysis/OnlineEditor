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

const VALID_EXPRESSIONS: ValidExpressionTestData[] = [["forward flow"], ["forward hello|world"]];

const INVALID_EXPRESSIONS: InvalidExpressionTestData[] = [];

const AUTOCOMPLETE_TEST_DATA: AutoCompleteTestData[] = [];

const REPLACEMENT_TEST_DATA: ReplacementTestData[] = [];

const labelTypeRegistry = new LabelTypeRegistry();

const mockPort = {
    // @ts-expect-error We mock the abstract class into a concrete one for simplicity. TypeScript however still thinks this is an abstract class, so it would throw an error
    parent: new DfdNodeImpl(),
} as unknown as DfdOutputPortImpl;

generateTests(
    "Functionality Test Language",
    AssignmentLanguageTreeBuilder.buildTree(mockPort, labelTypeRegistry),
    VALID_EXPRESSIONS,
    INVALID_EXPRESSIONS,
    AUTOCOMPLETE_TEST_DATA,
    REPLACEMENT_TEST_DATA,
);
