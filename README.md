# Data Flow Analysis - OnlineEditor

This repository contains both the Analysis Backend Server and the Frontend Online Editor.

# Setup 
### Setup Frontend

To set up the project locally, you need to have [Node.js](https://nodejs.org/en/) installed.
Then run the following commands to clone the repository and install the dependencies:

```shell
git clone https://github.com/arcovia-dev/OnlineEditorWithMitigation.git
cd OnlineEditorWithMitigation/frontend/webEditor
npm install
```
Now you need to change the Websocket Ip to the Ip of your server, or the local adress.
This is done Frontend/WebEditor/src/webSocket/webSocket.ts
For local use: "ws://localhost:3000/events/"

### Setup Backend With Mitigation

To set up the backend, download our product at https://github.com/DataFlowAnalysis/DataFlowAnalysis/releases.

Clone https://github.com/arcovia-dev/Mitigation and checkout the correct branch.
Import into eclipse.

Now import the OnlineEditor\backend\analysisBackendServer project into eclipse and set the target platform as active.

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

Set the target platform for Mitigation as active.
Then export deployable Plug-Ins and Fragments for The SMT, SAT, ILP and ranking packages.

Add the plugin folder to the target platform of the analysisBackendServer, set it as active and export the analysisBackendServer plugin.

To build an executable jar for the backend clone `https://github.com/DataFlowAnalysis/AnalysisBackendServerProduct`, add the plugin folder containing both the mitigation and analysisBackendServer plugins to the target platform, and run `mvn clean verify -Dtycho.localArtifacts=ignore`

The jar can be executed by running 
```shell
eclipse.exe --application org.dataflowanalysis.standalone.application -consoleLog (Windows)
eclipse --application org.dataflowanalysis.standalone.application -consoleLog (Linux/Mac)
```

### Z3 issues
If you are running an older Linux version and the SMT approach throws an exception you might have to manually downgrade the Z3 version in the lib folder of the SMT package.
