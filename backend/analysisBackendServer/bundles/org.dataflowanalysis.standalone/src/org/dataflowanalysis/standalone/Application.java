package org.dataflowanalysis.standalone;

import java.util.Scanner;

import org.dataflowanalysis.standalone.server.ApiServer;
import org.eclipse.equinox.app.IApplication;
import org.eclipse.equinox.app.IApplicationContext;

public class Application implements IApplication {
	@Override
	public Object start(IApplicationContext context) throws Exception {		
		try {			
            ApiServer.start();            
           
            Scanner scanner = new Scanner(System.in);
            String input = "";

            System.out.println("Type 'exit' to quit the program.");
            
        	while (!input.equalsIgnoreCase("exit")) {
                input = scanner.nextLine();
        	}
        	scanner.close();
            return IApplication.EXIT_OK;    
        } catch (Exception e) {
            e.printStackTrace();
        }      
		return IApplication.EXIT_OK;
	}

	@Override
	public void stop() {
		
	}
}
