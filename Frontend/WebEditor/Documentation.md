# Technical documentation

<!-- TODO: keyboard shortcuts raus weil steht im UI -->

## Tech Stack

To work on this project you need some knowledge about the following
used technologies:

-   [TypeScript](https://www.typescriptlang.org/)

    Used as the programming language for the project.
    All used libraries have good typings and this project is big enough
    to benefit from the type safety TypeScript provides compared to plain JavaScript.

-   [vite](https://vitejs.dev/)

    Used as the ts/css bundler and dev server.
    It has a fast development server which automatically reloads the page on
    TypeScript changes and automatically applies CSS changes without reloading the page.
    vite is used as a bundler to transpile the TypeScript to JavaScript,
    bundle the dependencies into JS chunks and bundle the CSS into a single CSS file.

    You don't need to know much about vite. The dev server is started using `npm run dev`,
    a static build is created using `npm run build`.
    The page is in `index.html` but is pretty empty besides the `script` tag that loads
    `src/index.ts` as the main application entry point.
    CSS should just be imported in any included TypeScript file and will be bundled automatically.

    Note that the generated static site, which is output in `dist/`,
    expects to run on an HTTP(S) server and does not work when
    being opened directly from the file system.
    For testing the statically built site any HTTP server will do, e.g. `python3 -m http.server`.
    For hosting the application in production you should use a proper HTTP server like nginx or apache2 with proper configuration.

-   [sprotty](https://sprotty.org/)

    sprotty is used as the core diagramming framework.
    It provides the diagram canvas, is responsible for rendering the diagram,
    zooming, panning, edge routing, etc.

    To work on this project you _definitely need_ to read the whole sprotty
    [documentation](https://sprotty.org/docs/overview/).

    Additionally, sprotty requires some knowledge about the following technologies:

    -   [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)

        Used to display the diagram elements.
        Sprotty requires all elements of a diagram to be converted
        into SVG elements, so we need to use SVG for that.
        Really only basic knowledge about the `g`, `rect`, `line`,
        and `text`.

    -   [inversify.js](https://github.com/inversify/InversifyJS)

        Used as a dependency injection framework by sprotty.
        sprotty uses this both for internal and external stuff.
        Diagram elements, sprotty configuration, custom commands, etc.
        are all registered in sprotty using inversify.js so
        we're required to use it for sprotty interaction and,
        as it is already required anyway, use it for injecting some of
        our own components too.

        To get started you should read the inversify.js [README](https://github.com/inversify/InversifyJS/blob/master/README.md)
        as well as the [Multi-injection guide](https://github.com/inversify/InversifyJS/blob/master/wiki/multi_injection.md).
        More in-depth features of inversify.js are not required for this project.

          <!-- TODO: difference between .to() and .toService() -->

-   [Font Awesome](https://fontawesome.com/)

    Used for the icons in some UIs.
    The free version is used and sufficient for this project.

## Repository structure

The repository is structured as follows:

```
.github/         # GitHub Actions workflows for Coninuous Integration
src/
    common/      # Common code module that is used by the whole application
    features/    # Feature modules of the application, more details below
    index.ts     # The main application entry point, loads all module and creates the sprotty diagram container
    page.css     # The CSS file for styling the sprotty container, make it full screen, etc.
    theme.css    # Contains CSS variables for colors with a light and dark theme
index.html       # The HTML file loaded by the browser, includes the main application entry point
package.json     # The npm package file, includes all dependencies and scripts
tsconfig.json    # TypeScript compiler settings
vite.config.ts   # Vite bundler and dev server settings
```

## Modules

The application is structured into multiple modules.
Each module is a feature of the application and is responsible for a specific part of the application.
Some features have hard dependencies on other features, other ones are independent or only
interact with other feature modules optionally, if they are present.

<!-- TODO: mermaid diagram -->

### Module overview

### Common

This common module contains some code adapting sprotty to our needs.
This includes:

-   Adding our own custom commands to the sprotty command palette and styling it.
-   General styling for UI elements
-   Deleting selected elements when pressing the delete key
-   Adding a "fit to screen" shortcut
-   Adding the help/keyboard shortcut UI with usage instructions on the bottom left of the screen
-   Fixing the browser viewport to be always at the origin, even if elements outside the viewport are focused

### Auto Layouting

Located in `src/features/autoLayout/`.

This module uses the Eclipse Layout Kernel (ELK) to automatically layout the diagram elements.
It is completely independent of the other modules and can be used with any diagram.
It adds a sprotty command to the command palette and a keyboard shortcut that invokes the ELK layouting algorithm using
the `sprotty-elk` helper provided by sprotty.

Additionally, it does some magic to run the layouting algorithm on the loaded model instead of
the model schema which is the intended use-case of the `sprotty-elk` helper.
However, we cannot do this because the size of various elements like all DFD Nodes are not
set in the model schema and unknown unless loaded.

### Copy Paste

Located in `src/features/copyPaste/`.

Allows for copying currently selected elements using `CTRL-C` and then later pasting them using `CTRL-V`.
The new elements are placed at the mouse position when pasting.

### DFD(Data-Flow Diagram) Elements

#### Diagram Elements

#### Dynamic Children Utility

#### Output Port Behavior Editor

#### Element Snapping

### Editor Mode

Located in `src/features/editorMode/`.

This editor currently has three different modes:

-   `edit`: The default mode, allows to view and edit the diagram. Creation of new elements is possible.
    Existing elements can be moved, modified, and deleted.
    Newly created diagrams are always in this mode.
-   `annotated`: In this mode the diagram is read-only. The node annotations (refer to the DFD elements module)
    are displayed and can be viewed to get information about e.g. analysis validation errors.
    The user can still zoom and pan the diagram. Creation, deletion, and modification of elements is not possible.
    However the user can click a button to switch to the `edit` mode.
    Doing so will remove all node annotations and allow the user to edit the diagram again.
-   `readonly`: This mode is similar to the `annotated` mode but does not allow switching back to the `edit` mode.
    It is intended to be used when the diagram is from a generated source and should only be viewed.

Diagrams with modes other than `edit` are not creatable using the editor.
Diagrams with these modes are intended to be generated from some other source.

This module contains the `EditorModeController` which manages the global editor mode.
All other modules that want to behave differently depending on the editor mode use this as a
source of truth and subscribe to changes of the editor mode.
Additionally, this module contains a UI that shows when the editor mode is not `edit`
and allows switching from `annotated` to `edit` mode.

### (DFD) Label

Located in `src/features/labelS/`.

Labels are metadata that can be added to any DFD diagram node.
These labels are used for the data flow analysis to ensure, e.g. that no unencrypted data is sent to an external entity.
Labels have a type and each type has one or multiple label values.
As an example, there might be the label type `Encrypted` with the following label values: `No`, `Yes`, `Partially`.

For the editor the DFD labels are used in two situations:

-   On DFD nodes, where they are displayed, added and removed
-   In the behavior language for output ports that are used to define whether the labels should be propagated
    over edges or be set depending on specific conditions.

This module does contain the `LabelTypeRegistry` where available label types and their values are managed.
Additionally, it provides a UI that allows to view all defined label types and values,
add new ones, remove existing ones, and edit the names of the label types and values.

### Serialization

Located in `src/features/serialization/`.

This module is responsible for loading and saving the diagram into/from a JSON file.
Loading/Saving can be invoked using the command palette or the keyboard shortcuts `CTRL-S` and `CTRL-O`.
Additionally, the default diagram, that is loaded by this module at startup, is defined here and
can be loaded at any time using the corresponding command in the command palette or the keyboard shortcut `CTRL-SHIFT-D`.

The module loads/saves the sprotty model but also the current labels from the DFD Label module
and the current editor mode if those modules are present.

After loading any model, the model is fit to the screen using the sprotty FitToScreen command.
If any node does not have a position set, the auto layouting module is called to layout the diagram,
if it is loaded.
This is intended for e.g. generated diagrams where the layout is unknown and should be
automatically determined when first loaded.

### Tool Palette

Located in `src/features/toolPalette/`.

Adds the UI in the top right corner with the tools that allow creation of nodes, edges and ports.

There is one super class `CreationTool` that holds shared logic and one subclass for each tool.
In the main tool palette UI the creation tools are instanced by element type.
Additionally, there is a keyboard shortcut for each tool using the `1` to `n` keys, depending on the number of available tools.
Each creation tool has support for previewing the element before placing it,
by adding a preview element to the sprotty viewer and only adding the real element when the mouse is clicked.
The creation of a new element can be cancelled by pressing the `ESC` key.
