CAUTION: This application exposes WebSocketServer and FrontEnd to the Network. If you want to run it locally only remove host:"0.0.0.0" from vite-server-with-shutdown.mjs


How to use:

Right now the official analysis products are not ready for constraints.
Download the adjusted plugins from https://cloud.t-hueller.de/index.php/s/axBGPRsQbFxcrnA
Put them into a plugin folder and reference them in the target platform.

Setup:

- Make sure node.js is installed

- Download and install DFA https://github.com/DataFlowAnalysis/product/releases/tag/v3.0.0

- Clone this repository and import into DFA

- Set Project target platform to active target platform

- Run Main 

 
How to build headless product:

!!Adjust Websocket server ip in WebSoccketHandler and vite-server-with-stutdown.mjs
If present delete node_modules folder.

- In DFA chose export and create Plugin for standalone plugin
- Add destination folder to targetplatform
- Run mvn clean verify
- IMPORTANT: Edit eclipse config.ini: Change org.eclipse.core.runtime_"version"@4 to org.eclipse.core.runtime_"version"@start
- start with eclipse --application org.dataflowanalysis.standalone.application -consoleLog
- exit by typing exit in console or FrontEnd will keep running
