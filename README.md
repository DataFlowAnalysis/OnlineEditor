# Data Flow Analysis - OnlineEditor

This repository contains both the Analysis Backend Server and the Frontend Online Editor.

# Setup 
### Setup Frontend

To set up the project locally, you need to have [Node.js](https://nodejs.org/en/) installed.
Then run the following commands to clone the repository and install the dependencies:

```shell
git clone https://github.com/DataFlowAnalysis/OnlineEditor.git
cd OnlineEditor/frontend/webEditor
npm install
```

By default, the Editor will connect to the remote backend at `wss://websocket.dataflowanalysis.org/events/`.
To use a local backend, change `webSocketAdress` in `src/features/serialize/webSocketHandler` to `ws://localhost:3000/events/`.

### Setup Backend

To set up the backend locally, download our product at https://github.com/DataFlowAnalysis/DataFlowAnalysis/releases.

Import the `analysisBackendServer` and set the target platform in this project's releng folder as the active target platform.

# Running locally
### Running Frontend 

To run the project locally for testing or development, run the following command:

```shell
npm run dev
```

This will start a local web server. To visit the page, either open the URL shown in the console or press `o` in the console.

### Running Backend 

Simply run main. Established connections are printed on the terminal.

As standard the server will be deployed at `localhost:3000/events`

# Building for production
### Building Frontend

To build the project for production run the following command:

```shell
npm run build
```

This will create a `dist` folder containing the built static assets. The contents of this folder can be uploaded to a web server to host the project.

### Building Backend

To build an executable jar for the backend clone `https://github.com/DataFlowAnalysis/AnalysisBackendServerProduct` and run `mvn clean verify`

The jar can be executed by running 
```shell
eclipse.exe --application org.dataflowanalysis.standalone.application -consoleLog (Windows)
eclipse --application org.dataflowanalysis.standalone.application -consoleLog (Linux/Mac)
```

# Actions

This project is built using GitHub Actions and the current built version is hosted on GitHub Pages that can be found [here](https://dataflowanalysis.github.io/OnlineEditor/).
