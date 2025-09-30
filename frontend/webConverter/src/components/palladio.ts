import { readFileContent, Model, ModelEndingsPalladio } from "./model";



export class PCMModel extends Model {
    files: File[] = [];
    filename: string;
    invalid = false;
    private static readonly expectedEndings = Object.values(ModelEndingsPalladio);

    constructor(files: File[]) {
        super();
        if (files.length < 7) {
            if (files.length > 0) this.filename = files[0].name.replace(/\.[^.]+$/, "");
            else this.filename = "No Model Input";
            this.invalid = true;
            return;
        }
        this.files = files;
        this.filename = files[0].name.replace(/\.[^.]+$/, "");
        const endings = files.map(f => {
            const m = f.name.match(/\.([^.]+)$/);
            return m ? m[1] : "";
        });
        if (PCMModel.expectedEndings.filter(e => !endings.includes(e)).length > 0) this.invalid = true;
    } 

    public async convertToMessage(): Promise<string> {
        var fileContents: { name: string, content: string }[] = [];
        for (var i = 0; i < this.files.length; i++) {
            fileContents.push({
                name: this.files[i].name, content: await readFileContent(this.files[i])
            });
        }

        const message = [
            ...fileContents.map(({ name, content }) => `${name}:${content}`),
        ].join("---FILE---");

        return message;
    }

    public getName(): string { return this.filename; }
    public getType(): string { return "Palladio Metamodel" };
    public isValid(): boolean { return !this.invalid };
}

