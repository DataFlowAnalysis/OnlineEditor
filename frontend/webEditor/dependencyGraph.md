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

    classDef diLess font-style:italic,stroke:#0fa
    class accordionUiExtension,editorTypes,utils diLess
```