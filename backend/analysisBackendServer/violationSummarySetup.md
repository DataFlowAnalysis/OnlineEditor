# Standalone DFA WebSocket Backend

> **CAUTION:** This application exposes a WebSocket server to the network.
> If you want to run it locally only, adjust the WebSocket host accordingly.

## Overview

This is a WebSocket server that exposes the DataFlowAnalysis backend
for use with the xDECAF web editor frontend. It is built using Tycho/Maven and
can be deployed headlessly.

## Prerequisites

- Java 17
- Maven 3.9+
- Git

## Development Setup

For local development without building a headless product:

- Clone DataFlowAnalysis repo and import bundles in Eclipse Product
- Clone this repository and import in Eclipse Product
- Set project target platform to active target platform
- Run `Main`

## Build

**Important:** Before building, update the local repository path in:
`releng/org.dataflowanalysis.standalone.targetplatform/org.dataflowanalysis.standalone.targetplatform.targetplatform.target`

Change the `file://` location to point to your local DataFlowAnalysis build output:
```xml
<repository location="file:///YOUR/PATH/TO/DataFlowAnalysis/releng/org.dataflowanalysis.analysis.updatesite/target/repository"/>
```

The standalone backend depends on modified bundles from the
[DataFlowAnalysis](https://github.com/dalu-wins/DataFlowAnalysis) repository.
You must build that first.

**Step 1 — Build the modified DataFlowAnalysis bundles:**
```bash
git clone https://github.com/dalu-wins/DataFlowAnalysis.git
cd DataFlowAnalysis
mvn clean install -Dtycho.localArtifacts=ignore -Dtycho.target.eager=true
```

**Step 2 — Build the standalone backend:**
```bash
cd OnlineEditor/backend/analysisBackendServer
mvn clean package -Dtycho.localArtifacts=ignore -Dtycho.target.eager=true
```

The deployable archive will be at:
```
releng/org.dataflowanalysis.standalone.product/target/products/standalone-dfa-server-linux.gtk.x86_64.tar.gz
```

## Deploy

Copy the archive to your server and extract it:
```bash
tar -xzf standalone-dfa-server-linux.gtk.x86_64.tar.gz
```

Run the server:
```bash
./standalone-dfa-server -application org.dataflowanalysis.standalone.application -noSplash -consoleLog
```

The WebSocket server will start on port 3000 at `/events`.

## Run as a systemd service

Create `/etc/systemd/system/dfa-server.service`:
```ini
[Unit]
Description=DataFlow Analysis WebSocket Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/standalone-dfa-server
ExecStart=/path/to/standalone-dfa-server -application org.dataflowanalysis.standalone.application -noSplash -consoleLog
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dfa-server
sudo systemctl start dfa-server
```