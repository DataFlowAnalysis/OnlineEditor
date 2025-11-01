```mermaid
stateDiagram-v2
    [*] --> helpUi
    [*] --> startUpAgent
    helpUi --> accordionUiExtension
    helpUi --> editorTypes
    startUpAgent --> editorTypes
    [*] --> commonModule
    [*] --> labels
    labels --> utils
    labels --> editorTypes
    labels --> accordionUiExtension

    serialize --> labels
    serialize --> constraint
    serialize --> editorMode
    [*] --> serialize
    serialize --> commonModule: logger

    [*] --> editorMode
    serialize --> editorMode

    [*] --> diagram

    classDef diLess font-style:italic,stroke:#0fa
    class accordionUiExtension,editorTypes,utils diLess
```

green packages do not export a module