How to use:

Setup:

- Make sure node.js is installed

- Download and install DFA https://github.com/DataFlowAnalysis/product/releases/tag/v3.0.0

- Clone https://github.com/DataFlowAnalysis/DataFlowAnalysis and checkout integratedCycles

- Clone https://github.com/DataFlowAnalysis/Converter and checkout annotations

- Clone this repository
 
- Install Jetty Bundles From Eclipse Updatesite https://download.eclipse.org/oomph/jetty/release/11.0.24

- IF METAINF ERROR Install SLF4J From https://download.eclipse.org/releases/2022-12/202212071000

- Import all projects into DFA (for reasons... this project might need to be imported with File->Import->Existing Projects into Workspace)

- clean and build all projects otherwise this project will not see the correct branch of DFA and converter

Usage:

- Run Main
- Load Model or edit default model (make sure no cycle and that all pins are valid - especially when you delete the input pin)
- Press Ctrl - A to analyze