package org.dataflowanalysis.standalone.api;

import org.dataflowanalysis.standalone.services.LoadDDService;

public class LoadDDServlet extends Servlet {
    
    private static final long serialVersionUID = 1L;
    private final LoadDDService loadDDService = new LoadDDService();    
    
    protected String doSpecific(String message, String name){
        return loadDDService.safeLoadAndConvertDFDString(message, name);
    }
}
