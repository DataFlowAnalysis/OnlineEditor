import { FileData } from "./loadJson";

function getFiles(acceptedTypes: string[], amount: number): Promise<File[]> {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = acceptedTypes.join(",");
    input.multiple = amount > 1;
    const fileLoadPromise = new Promise<File[]>((resolve, reject) => {
        input.onchange = () => {
            if (!input.files || input.files.length !== amount) {
                reject("No file selected");
                return;
            }
            resolve(Array.from(input.files));
        };

        input.oncancel = () => {
            reject("Canceled file selection");
        };
    });

    input.click();

    return fileLoadPromise;
}

function readFile(file: File): Promise<FileData<string>> {
    return new Promise<FileData<string>>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
            resolve({
                fileName: file.name,
                content: reader.result as string, // since we use readAsText reader.result is always a string
            });
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

export async function chooseFiles(acceptedTypes: string[], amount: number): Promise<FileData<string>[]> {
    const files = await getFiles(acceptedTypes, amount).catch(() => [] as File[]);
    return Promise.all(files.map(readFile));
}

export function chooseFile(acceptedTypes: string[]): Promise<FileData<string> | undefined> {
    return chooseFiles(acceptedTypes, 1).then((files) => (files ? files[0] : undefined));
}
