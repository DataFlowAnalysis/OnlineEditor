package org.dataflowanalysis.standalone;

import org.dataflowanalysis.standalone.websocket.WebSocketServerUtils;

public class Main {
	public static void main(String[] args) {		
		try {			       
            Thread webSocketServer =  WebSocketServerUtils.startWebSocketServer();
                        
            while(webSocketServer.isAlive());

        } catch (Exception e) {
            e.printStackTrace();
        }      

	}
}
