export class FileName {
    private name: string = 'diagram';

    getName(): string {
        return this.name;
    }

    setName(newName: string): void {
        const lastIndex = newName.lastIndexOf('.');
        this.name = lastIndex === -1 ? newName : newName.substring(0, lastIndex);

        document.title = this.name + '.json - DFD WebEditor';
    }
}