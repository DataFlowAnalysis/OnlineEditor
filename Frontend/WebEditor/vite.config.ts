import { defineConfig } from "vite";

export default defineConfig({
    // By default vite uses absolute paths from the content root (e.g. /index.html).
    // Because this project is hosted with GitHub actions without a custom domain,
    // it is located in a subdirectory/subbase and we need relative paths.
    // The below setting tells vite to use relative paths everywhere.
    base: "",
});
