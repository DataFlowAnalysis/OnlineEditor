import { Model } from "./model";

const webSocketAdress = `wss://websocket.dataflowanalysis.org/events/`;

let ws: WebSocket;
let wsId = -1;

/**
 * Initializes the WebSocket and sets up all event handlers.
 */
function initWebSocket() {
    ws = new WebSocket(webSocketAdress);

    ws.onopen = () => {
        console.log("WebSocket connection established.");
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed. Reconnecting...");
        initWebSocket();
    };

    ws.onerror = () => {
        console.log("WebSocket encountered an error. Reconnecting...");
        initWebSocket();
    };

    ws.onmessage = (event) => {
        console.log("WebSocketID:", wsId);
        console.log(event.data);
        let message = event.data;


        // Example of specific handling for certain messages:
        if (event.data.startsWith("Error:")) {
            alert(event.data);
            return;
        }
        if (message.startsWith("ID assigned:")) {
            wsId = parseInt(event.data.split(":")[1].trim(), 10);
            return;
        }
        if (message === "Shutdown") {
            return;
        }

        const name = message.split(":")[0];
        message = message.replace(name + ":", "");

        if (message.trim().endsWith("</datadictionary:DataDictionary>")) {
            const closingTag = "</dataflowdiagram:DataFlowDiagram>";
            const endIndex = message.indexOf(closingTag);
            var dfdString: string = "";
            var ddString: string = "";

            if (endIndex !== -1) {
                // Extract everything up to and including the closing tag
                dfdString = message.slice(0, endIndex + closingTag.length).trim();

                // Extract everything after the closing tag
                ddString = message.slice(endIndex + closingTag.length).trim();
            }
            saveFile(dfdString, name, ".dataflowdiagram");
            saveFile(ddString, name, ".datadictionary");
            return;
        } 

        saveFile(message, name, ".json");
    };
}

async function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function saveFile(file: string, fileName: string, ending: string) {
    const blob = new Blob([file], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName + ending);
    document.body.appendChild(link); // Append link to the body
    link.click(); // Programmatically click to trigger download
    URL.revokeObjectURL(url); // Revoke the URL after download
    link.remove(); // Remove the link from the DOM
}

export async function sendMessage(toDFD: boolean, models:Model[]) {
    if (wsId == -1) initWebSocket();

    console.log(models);

    var type = models[0].getType();

    if (type === "WebJson") {
        for (const model of models) {
            ws.send(wsId + ":" + model.getName() + ":" + "Json2DFD:" + await model.convertToMessage());
        }
    } else if (type === "DFD Metamodel") {
        for (const model of models) {
            ws.send(wsId + ":" + model.getName() + ":DFD:" + await model.convertToMessage());
        }
    } else if (type === "Palladio Metamodel") {
        for (const model of models) {
            ws.send(wsId + ":" + model.getName() + ":" + (toDFD ? "PCM2DFD:" : "") + await  model.convertToMessage());
        }
    }  
}

// Initialize immediately upon module load
initWebSocket();
