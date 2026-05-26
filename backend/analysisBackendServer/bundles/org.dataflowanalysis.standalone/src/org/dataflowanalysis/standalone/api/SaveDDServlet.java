package org.dataflowanalysis.standalone.api;

import org.dataflowanalysis.standalone.services.SaveDDService;


public class SaveDDServlet extends Servlet {
    
    private static final long serialVersionUID = 1L;
    private final SaveDDService saveDDService = new SaveDDService();
    
    protected String doSpecific(String message, String name){
        return saveDDService.convertToDFDandStringify(message, name);
    }
}
