import { vi } from "vitest";

vi.stubGlobal("window", {
    location: {
        href: "",
    },
});

vi.mock("../../src/diagram/ports/DfdOutputPort", () => ({}));

vi.mock("../../src/diagram/nodes/common", () => {
    class DfdNodeImpl {
        // add any abstract methods the tested code calls
        getAvailableInputs = vi.fn().mockReturnValue(["flow", "hello|world"]);
    }

    return { DfdNodeImpl };
});
