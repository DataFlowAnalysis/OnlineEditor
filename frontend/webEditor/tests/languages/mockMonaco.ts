import { vi } from "vitest";

vi.stubGlobal("window", {
    location: {
        href: "",
    },
});
