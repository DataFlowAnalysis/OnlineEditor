How to use:

Setup:
- Make sure node.js is installed
- Download and install DFA https://github.com/DataFlowAnalysis/product/releases/tag/v3.0.0
- Clone https://github.com/DataFlowAnalysis/DataFlowAnalysis and checkout integratedCycles
- Clone https://github.com/DataFlowAnalysis/Converter and checkout annotations
- Clone this repository
- Import all projects into DFA (for reasons... this project might need to be imported with File->Import->Existing Projects into Workspace)

- go to resources/WebEditor/ and run git init, then npm install(done automatically in theory but make sure)

- clean and build all projects otherwise this project will not see the correct branch of DFA and converter

Usage:
- MAKE SURE PORT 3002 on localhost is free or adjust in resources/WebEditor/src/index.ts and server.mjs

- In src/Main set modelPath to a json DFD or the place (including name and ending) you want the new model to be safed.
- IF LINUX!!! adjust npm command for frontEndThread
- Run main
- Adjust DFD to your liking

- DONT ANALYZE DEFAULT DIAGRAM WITHOUT REMOVING THE CYCLE

- Safe with Crtl+S or Crtl+Space->Save Diagram as Json to start Analysis        ->        Editor will freeze
- Refresh page after 5 or more (depending on DFD size) seconds
  
- RESTART EVERYTHING ON ERROR THROWN
  
- It should show the adjusted DFD with annotations

