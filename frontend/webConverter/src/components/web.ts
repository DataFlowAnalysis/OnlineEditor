import { readFileContent, Model, ModelEndingsWeb } from "./model";



export class WebModel extends Model {
    
    file: File;
    filename: string;
    invalid = false;
    private static readonly expectedEndings = Object.values(ModelEndingsWeb);

    constructor(file: File) {
        super();
        this.file = file;
        this.filename = file.name.replace(/\.[^.]+$/, "");
        const ending = file.name.substring(file.name.lastIndexOf(".") + 1);
        console.log("Ending: " + ending);
        if (ending !== ModelEndingsWeb.json) this.invalid = true;        
    }

    public async convertToMessage(): Promise<string> {
        var message = await readFileContent(this.file);
        console.log(message);
        return message;
    }

    public getName(): string { return this.filename; }
    public getType(): string { return "WebJson" };
    public isValid(): boolean { return !this.invalid };
}


