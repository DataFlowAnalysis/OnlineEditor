/**
 * Type identifiers for use with inversify.
 */
export const EDITOR_TYPES = {
    // Enableable and disableable tools that can be used to create new elements.
    CreationTool: Symbol("CreationTool"),
    // All IUIExtension instances that are bound to this symbol will
    // be loaded and enabled at editor startup.
    DefaultUIElement: Symbol("DefaultUIElement"),
};