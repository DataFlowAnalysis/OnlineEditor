package org.dataflowanalysis.standalone;

import org.dataflowanalysis.standalone.websocket.WebSocketServerUtils;
import org.eclipse.equinox.app.IApplication;
import org.eclipse.equinox.app.IApplicationContext;

public class Application implements IApplication {
    @Override
    public Object start(IApplicationContext context) throws Exception {
        try {
            Thread webSocketServer = WebSocketServerUtils.startWebSocketServer();
            webSocketServer.join(); // block until server thread dies
        } catch (Exception e) {
            e.printStackTrace();
        }
        return IApplication.EXIT_OK;
    }
    @Override
    public void stop() {
    }
}