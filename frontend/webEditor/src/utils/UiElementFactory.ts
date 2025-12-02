import "./baseUiElements.css";

export class UiElementFactory {
    private constructor() {}

    public static buildDeleteButton() {
        const button = document.createElement("button");
        button.classList.add("delete-button");
        const symbol = document.createElement("span");
        symbol.classList.add("codicon", "codicon-trash");
        button.appendChild(symbol);
        return button;
    }

    public static buildAddButton(text: string) {
        const button = document.createElement("button");
        button.classList.add("add-button");
        const symbol = document.createElement("span");
        symbol.classList.add("codicon", "codicon-add");
        button.appendChild(symbol);
        const textHolder = document.createElement("span");
        textHolder.innerText = text;
        button.appendChild(textHolder);
        return button;
    }
}
