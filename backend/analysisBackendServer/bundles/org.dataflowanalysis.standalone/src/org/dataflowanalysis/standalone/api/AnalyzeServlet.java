package org.dataflowanalysis.standalone.api;

import org.dataflowanalysis.standalone.services.AnalyzeService;

import com.fasterxml.jackson.core.JsonProcessingException;

public class AnalyzeServlet extends Servlet {
    private static final long serialVersionUID = 1L;
    private final AnalyzeService analysisService = new AnalyzeService();
    
    protected String doSpecific(String message, String name){
        try {
            return analysisService.analyzeAnnotate(message);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Json unparsable");
        }
    }
}
