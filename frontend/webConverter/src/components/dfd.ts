import { readFileContent, Model, ModelEndingsDFD } from "./model";

export class DFDModel extends Model{
    files: File[] = [];
    filename: string;
    invalid = false;
    private static readonly expectedEndings = Object.values(ModelEndingsDFD);

    constructor(files: File[]) {
        super();
        if (files.length < 2) {
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
        if (DFDModel.expectedEndings.filter(e => !endings.includes(e)).length > 0) this.invalid = true;
    }

    public async convertToMessage(): Promise<string> {
        var dataflowFileContent: string;
        var dictionaryFileContent: string;
        if (this.files[0].name.endsWith(".datadictionary")) {
            dictionaryFileContent = await readFileContent(this.files[0]);
            dataflowFileContent = await readFileContent(this.files[1]);
        } else {
            dictionaryFileContent = await readFileContent(this.files[1]);
            dataflowFileContent = await readFileContent(this.files[0]);
        }

        return dataflowFileContent + "\n:DD:\n" + dictionaryFileContent;
    }

    public getName(): string { return this.filename; }
    public getType(): string {

        console.log("was herer");
        return "DFD Metamodel"
    };
    public isValid(): boolean { return !this.invalid };
}
    

