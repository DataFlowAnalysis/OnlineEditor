package org.dataflowanalysis.standalone;

import org.dataflowanalysis.standalone.frontend.FrontendUtils;
import org.dataflowanalysis.standalone.websocket.WebSocketServerUtils;

public class Main {
	public static void main(String[] args) {		
		try {			       
            Thread frontEnd =  FrontendUtils.startFrontendServer();
            Thread webSocketServer =  WebSocketServerUtils.startWebSocketServer();
                        
            while(frontEnd.isAlive() || webSocketServer.isAlive());

        } catch (Exception e) {
            e.printStackTrace();
        }      

	}
}
