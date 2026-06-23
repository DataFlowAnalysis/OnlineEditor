package org.dataflowanalysis.standalone.api;

import org.dataflowanalysis.standalone.services.LoadPCMService;

public class LoadPCMServlet extends Servlet {
    
    private static final long serialVersionUID = 1L;
    private final LoadPCMService loadPCMService = new LoadPCMService();
    
    protected String doSpecific(String message, String name){
        return loadPCMService.safeLoadAndConvertPCMString(message);
    }
}
