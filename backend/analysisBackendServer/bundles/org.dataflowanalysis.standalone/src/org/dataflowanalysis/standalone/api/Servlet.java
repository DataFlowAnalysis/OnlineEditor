package org.dataflowanalysis.standalone.api;

import java.io.IOException;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public abstract class Servlet extends HttpServlet{
    private static final long serialVersionUID = 1L;
    
    @Override    
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String message = request.getReader()
                .lines()
                .collect(Collectors.joining(System.lineSeparator()));
        
        String name = message.split(":")[0];
        message = message.replaceFirst(name + ":", "");

        try {
            var result = doSpecific(message, name);            
            writeText(response, HttpServletResponse.SC_OK, name + ":" + result);
        } catch (IllegalArgumentException e) {
            writeText(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            writeText(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    private void writeText(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("text/plain;charset=UTF-8");
        response.getWriter().write(message);
    }
    
    /**
     * Servlet specific activities
     * @param message Incoming message content 
     * @param name Name of the diagram
     * @return result
     */
    protected abstract String doSpecific(String message, String name);
}
