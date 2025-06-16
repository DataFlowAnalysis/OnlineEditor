package org.dataflowanalysis.standalone.websocket;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;

import org.apache.log4j.Logger;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;
import org.dataflowanalysis.standalone.analysis.Converter;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class WebSocketServerHandler extends WebSocketAdapter
{
    private static Map<Integer, Session> sessions = new HashMap<>();
    private static int index = 0;
    private final Logger logger = Logger.getLogger(WebSocketServerHandler.class);
   
    /**
     * Assigns an ID for identification on websocket connection
     * @param sess Session that was created and is saved for further communication 
     */
    @Override
    public void onWebSocketConnect(Session sess)
    {
        super.onWebSocketConnect(sess);	
        logger.info("WS connection established");
        
        sessions.put(index, sess);
        try {
			sess.getRemote().sendString("ID assigned:" + index);
		} catch (IOException e) {
			e.printStackTrace();
		}
        index++;
    }

    /**
     * Handles incoming messages, if valid sends return message to identified session
     * @param message Incoming message
     */
    @Override
    public void onWebSocketText(String message)
    {    	
        super.onWebSocketText(message);
        var analysisThread = new Thread(() -> {
        	var id = Integer.parseInt(message.split(":")[0]);
			String returnMessage = handleIncomingMessage(id, message.substring(message.indexOf(":")+1));
		    
		    	try {
		    	    if (!returnMessage.endsWith("null")) sessions.get(id).getRemote().sendString(returnMessage);
		    	    else {sessions.get(id).getRemote().sendString("Error: Unknown Error");
		    	    }
				} catch (IOException e) {
					e.printStackTrace();					
				}
		        
        });
        analysisThread.start();    		
    }

    @Override
    public void onWebSocketClose(int statusCode, String reason)
    {
        super.onWebSocketClose(statusCode, reason);
    }

    @Override
    public void onWebSocketError(Throwable cause)
    {
        super.onWebSocketError(cause);
        cause.printStackTrace(System.err);
    }
    
    private String handleIncomingMessage(int id, String message) {
    	logger.info("Message received");
        logger.debug(message);
        
    	var objectMapper = new ObjectMapper();
    	WebEditorDfd newJson = null;
    	
		var name = message.split(":")[0];
		message = message.replaceFirst(name + ":", "");	 
    	
    	try {
	    	if (message.startsWith("Json:")) {
	    		message = message.substring(message.indexOf(":") + 1);	    		
				newJson = deserializeJsonAndAnnotate(message);	    				
	    	}
	    	else if (message.startsWith("Json2DFD:")) {
	    		message = message.replaceFirst("Json2DFD:", "");   		
				var webEditorDfd = deserializeJson(message);
			    return name + ":" + Converter.convertToDFDandStringify(webEditorDfd, name);	
	    	} 
	    	else if (message.startsWith("DFD:")) {
	    		newJson = safeLoadAndConvertDFDString(message, name);
	    	} else {
	    	    newJson = safeLoadAndConvertPCMString(message);
	    	}
    	} catch (IllegalArgumentException e) {
			return "Error:" + e.getMessage();
		}
    	
    	try {
			return name + ":" + objectMapper.writeValueAsString(newJson);
		} catch (JsonProcessingException e) {
			return "Error:" + " Unable to read Json";
		}
    }    
    
    private WebEditorDfd deserializeJsonAndAnnotate(String json){
    	var objectMapper = new ObjectMapper();
    	WebEditorDfd webEditorDfd;
		try {
			webEditorDfd = objectMapper.readValue(json, WebEditorDfd.class);
		} catch (IOException e) {
			e.printStackTrace();
			throw new IllegalArgumentException("Invalid Json Model");
		} 
		objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
		objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
		return Converter.analyzeAnnotate(webEditorDfd);
    }
    
    private WebEditorDfd deserializeJson(String json){
    	var objectMapper = new ObjectMapper();
    	WebEditorDfd webEditorDfd;
		try {
			webEditorDfd = objectMapper.readValue(json, WebEditorDfd.class);
		} catch (IOException e) {
			e.printStackTrace();
			throw new IllegalArgumentException("Invalid Json Model");
		} 
		objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
		objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
		return webEditorDfd;
    }
    
    private WebEditorDfd safeLoadAndConvertDFDString(String message, String name) {
		message = message.replaceFirst("DFD:", "");
		var dfdMessage = message.split("\n:DD:\n")[0];
		var ddMessage = message.split("\n:DD:\n")[1];
		try {            
			var dfd = createAndWriteTempFile(name + ".dataflowdiagram", dfdMessage);
			var dd = createAndWriteTempFile(name + ".datadictionary", ddMessage);
			return Converter.convertDFD(dfd, dd);
		} catch (IOException e) {
		    e.printStackTrace();
            throw new IllegalArgumentException("Invalid DFD Model");
		}
    }
    
    private WebEditorDfd safeLoadAndConvertPCMString(String message) {
    	try {
	        String[] files = message.split("---FILE---");
	        
	        File usageModelFile = null;
	        File allocationFile = null;
	        File nodeCharacteristicsFile = null;

	        for (String fileSection : files) {
	            fileSection = fileSection.trim();
	            if (fileSection.isEmpty()) continue;

	            int firstColon = fileSection.indexOf(":");
	            if (firstColon == -1) continue; 

	            String filename = fileSection.substring(0, firstColon);
	            String fileContent = fileSection.substring(firstColon + 1);

	            File file = createAndWriteTempFile(filename, fileContent);
	            
	            if (filename.endsWith(".usagemodel")) {
	                usageModelFile = file;
	            } else if (filename.endsWith(".allocation")) {
	                allocationFile = file;
	            } else if (filename.endsWith(".nodecharacteristics")) {
	                nodeCharacteristicsFile = file;
	            } 
	        }
	        return  Converter.convertPCM(usageModelFile, allocationFile, nodeCharacteristicsFile);
	    } catch (IOException e) {	    	
	        e.printStackTrace();
            throw new IllegalArgumentException("Invalid PCM Model");
	    }
    }
    
    private File createAndWriteTempFile(String name, String content) throws IOException {
    	String tempDir = System.getProperty("java.io.tmpdir");
    	var file = new File(tempDir, name);
    	file.deleteOnExit();
    	FileWriter fileWriter = new FileWriter(file);
    	fileWriter.write(content);
    	fileWriter.close();
    	return file;
    }    
}