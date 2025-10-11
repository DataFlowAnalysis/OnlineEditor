```mermaid
stateDiagram-v2
    [*] --> helpUi
    [*] --> startUpAgent
    helpUi --> accordionUiExtension
    helpUi --> editorTypes
    startUpAgent --> editorTypes
    [*] --> commonModule

    classDef diLess font-style:italic,stroke:#0ff
    class accordionUiExtension,editorTypes diLess
```