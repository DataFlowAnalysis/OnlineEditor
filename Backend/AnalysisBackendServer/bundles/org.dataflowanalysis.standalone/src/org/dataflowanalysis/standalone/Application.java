package org.dataflowanalysis.standalone;

import java.util.Scanner;

import org.dataflowanalysis.standalone.frontend.FrontendUtils;
import org.dataflowanalysis.standalone.websocket.WebSocketServerUtils;
import org.eclipse.equinox.app.IApplication;
import org.eclipse.equinox.app.IApplicationContext;

public class Application implements IApplication {
	@Override
	public Object start(IApplicationContext context) throws Exception {		
		try {			
			           
            Thread frontend =  FrontendUtils.startFrontendServerForApplication();
            Thread webSocketServer = WebSocketServerUtils.startWebSocketServer();
            
           
            Scanner scanner = new Scanner(System.in);
            String input = "";

            System.out.println("Type 'exit' to quit the program.");

            // Loop until user types "exit"
            
            
            while(frontend.isAlive() || webSocketServer.isAlive()) {
            	while (!input.equalsIgnoreCase("exit")) {
                    input = scanner.nextLine();
                } 
                FrontendUtils.stopFrontendServer();
                scanner.close();
                return IApplication.EXIT_OK;                
            };
            scanner.close();            
        } catch (Exception e) {
            e.printStackTrace();
        }      
		return IApplication.EXIT_OK;
	}

	@Override
	public void stop() {
		FrontendUtils.stopFrontendServer();		
	}
}
