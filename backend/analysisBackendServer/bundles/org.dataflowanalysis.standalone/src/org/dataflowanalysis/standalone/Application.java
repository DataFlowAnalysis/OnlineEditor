package org.dataflowanalysis.standalone;


import org.dataflowanalysis.standalone.server.ApiServer;
import org.eclipse.equinox.app.IApplication;
import org.eclipse.equinox.app.IApplicationContext;

public class Application implements IApplication {
	@Override
	public Object start(IApplicationContext context) throws Exception {		
		try {			
            ApiServer.start();            
        } catch (Exception e) {
            e.printStackTrace();
        }      
		return IApplication.EXIT_OK;
	}

	@Override
	public void stop() {
		
	}
}
