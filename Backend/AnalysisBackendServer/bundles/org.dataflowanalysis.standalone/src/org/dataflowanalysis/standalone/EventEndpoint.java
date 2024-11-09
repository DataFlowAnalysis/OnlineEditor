package org.dataflowanalysis.standalone;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CountDownLatch;
import org.dataflowanalysis.analysis.pcm.PCMDataFlowConfidentialityAnalysisBuilder;
import org.dataflowanalysis.converter.Converter;
import org.dataflowanalysis.converter.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.DataFlowDiagramConverter;
import org.dataflowanalysis.converter.PCMConverter;
import org.dataflowanalysis.converter.WebEditorConverter;
import org.dataflowanalysis.converter.webdfd.WebEditorDfd;
import org.dataflowanalysis.dfd.datadictionary.DataDictionary;
import org.dataflowanalysis.dfd.datadictionary.datadictionaryPackage;
import org.dataflowanalysis.dfd.dataflowdiagram.DataFlowDiagram;
import org.dataflowanalysis.dfd.dataflowdiagram.dataflowdiagramPackage;
import org.dataflowanalysis.pcm.extension.dictionary.characterized.DataDictionaryCharacterized.DataDictionaryCharacterizedPackage;
import org.dataflowanalysis.pcm.extension.nodecharacteristics.nodecharacteristics.NodeCharacteristicsPackage;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.util.EcoreUtil;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;
import org.palladiosimulator.pcm.allocation.AllocationPackage;
import org.palladiosimulator.pcm.repository.RepositoryPackage;
import org.palladiosimulator.pcm.resourceenvironment.ResourceenvironmentPackage;
import org.palladiosimulator.pcm.system.SystemPackage;
import org.palladiosimulator.pcm.usagemodel.UsagemodelPackage;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class EventEndpoint extends WebSocketAdapter
{
    private final CountDownLatch closureLatch = new CountDownLatch(1);
    private static Map<Integer, Session> sessions = new HashMap<>();
    private static int index = 0;
   
    
    @Override
    public void onWebSocketConnect(Session sess)
    {
        super.onWebSocketConnect(sess);	
        System.out.println("WS connection established");
        
        sessions.put(index, sess);
        try {
			sess.getRemote().sendString("ID assigned:" + index);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        index++;
    }

    @Override
    public void onWebSocketText(String message)
    {
    	
        super.onWebSocketText(message);
        var analysisThread = new Thread(() -> messageThread(message));
        analysisThread.start();
        try {
			analysisThread.join();
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    private void messageThread(String message) {
    	try {
        	var id = Integer.parseInt(message.split(":")[0]);
			String returnMessage = handleIncomingMessage(id, message.substring(message.indexOf(":")+1));
		    if (returnMessage != null) {
		    	sessions.get(id).getRemote().sendString(returnMessage);
		    }    
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }

    @Override
    public void onWebSocketClose(int statusCode, String reason)
    {
        super.onWebSocketClose(statusCode, reason);
        closureLatch.countDown();
    }

    @Override
    public void onWebSocketError(Throwable cause)
    {
        super.onWebSocketError(cause);
        cause.printStackTrace(System.err);
    }

    public void awaitClosure() throws InterruptedException
    {
        closureLatch.await();
    }
    
    private String handleIncomingMessage(int id, String message) {
    	System.out.println("Message received");
    	var objectMapper = new ObjectMapper();
    	WebEditorDfd newJson = null;
    	
    	if (message.startsWith("Json:")) {
    		message = message.replaceFirst("Json:", "");
    		
    		try {
				var webEditorDfd = objectMapper.readValue(message, WebEditorDfd.class);
				objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
			     objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
			     newJson = analyzeAnnotateAndSafe(webEditorDfd);
			     
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				return "Error:Test";
			} catch (Exception e) {
				e.printStackTrace();
				return null;
			}			 
    	} 
    	else if (message.startsWith("Json2DFD:")) {
    		message = message.replaceFirst("Json2DFD:", "");
    		var name = message.split(":")[0];
    		message = message.replaceFirst(name + ":", "");
    		
    		try {
				var webEditorDfd = objectMapper.readValue(message, WebEditorDfd.class);
				objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
			     objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
			     return convertToDFDandStringify(webEditorDfd, name);
			     
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				return "Error:Test";
			} catch (Exception e) {
				e.printStackTrace();
				return null;
			}			 
    	} 
    	else if (message.startsWith("DFD:")) {
    		message = message.replaceFirst("DFD:", "");
    		String name = message.split(":")[0];
    		message = message.replaceFirst(name + ":", "");
    		var dfdMessage = message.split("\n:DD:\n")[0];
    		var ddMessage = message.split("\n:DD:\n")[1];
    		try {
                String tempDir = System.getProperty("java.io.tmpdir");
				var dfd = new File(tempDir, name + ".dataflowdiagram");
				var dd = new File(tempDir, name + ".datadictionary");
				dfd.deleteOnExit();
				dd.deleteOnExit();
				 FileWriter writerDFD = new FileWriter(dfd);
				 FileWriter writerDD = new FileWriter(dd);
				 writerDFD.write(dfdMessage);
				 writerDFD.close();
				 writerDD.write(ddMessage);
				 writerDD.close();
				 newJson = convertDFD(dfd, dd);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	} else {
    	    try {
    	        // Split the message using the unique delimiter
    	        String[] fileSections = message.split("---FILE---");
    	        
    	        // Create a temporary directory to store files
    	        String tempDir = System.getProperty("java.io.tmpdir");
    	        
    	        File usageModelFile = null;
    	        File allocationFile = null;
    	        File nodeCharacteristicsFile = null;

    	        for (String fileSection : fileSections) {
    	            // Trim any whitespace and ignore empty sections
    	            fileSection = fileSection.trim();
    	            if (fileSection.isEmpty()) continue;

    	            // Each file section should be in the format <filename>:<content>
    	            int firstColon = fileSection.indexOf(":");
    	            if (firstColon == -1) continue; // Skip invalid sections

    	            // Extract filename and content
    	            String filename = fileSection.substring(0, firstColon);
    	            String fileContent = fileSection.substring(firstColon + 1);

    	            // Create a file in the temp directory with the provided name and content
    	            File file = new File(tempDir, filename);
    	            file.deleteOnExit();
    	            
    	            try (FileWriter writer = new FileWriter(file)) {
    	                writer.write(fileContent);
    	            }

    	            // If needed, perform specific actions on certain files
    	         // Store specific files for the converter if they match the required extensions
    	            if (filename.endsWith(".usagemodel")) {
    	                usageModelFile = file;
    	            } else if (filename.endsWith(".allocation")) {
    	                allocationFile = file;
    	            } else if (filename.endsWith(".nodecharacteristics")) {
    	                nodeCharacteristicsFile = file;
    	            } 
    	        }
    	        System.out.println(usageModelFile.toString());
    	        newJson = convertPCM(usageModelFile, allocationFile, nodeCharacteristicsFile);
    	    } catch (Exception e) {
    	        e.printStackTrace();
    	    }
    	}
    	
    	
    	try {
			return objectMapper.writeValueAsString(newJson);
		} catch (JsonProcessingException e) {
			return null;
		}
    }
    
    private WebEditorDfd convertDFD(File dfd, File dd){
    	try {
    	var converter = new DataFlowDiagramConverter();
    	
    	ResourceSet rs = new ResourceSetImpl();
		rs.getResourceFactoryRegistry().getExtensionToFactoryMap().put(Resource.Factory.Registry.DEFAULT_EXTENSION, new XMIResourceFactoryImpl());
		rs.getPackageRegistry().put(dataflowdiagramPackage.eNS_URI, dataflowdiagramPackage.eINSTANCE);
		rs.getPackageRegistry().put(datadictionaryPackage.eNS_URI, datadictionaryPackage.eINSTANCE);

		Resource ddResource = rs.getResource(URI.createFileURI(dd.toString()), true);		
		Resource dfdResource = rs.getResource(URI.createFileURI(dfd.toString()), true);
		System.out.println(dd.toString());
		System.out.println(dfd.toString());
		EcoreUtil.resolveAll(rs);
		EcoreUtil.resolveAll(ddResource);
		EcoreUtil.resolveAll(dfdResource);
		DataFlowDiagramAndDictionary dfdAndDD = new DataFlowDiagramAndDictionary((DataFlowDiagram)dfdResource.getContents().get(0), (DataDictionary)ddResource.getContents().get(0));
		
		var newJson = converter.dfdToWeb(dfdAndDD);		
		dfd.delete();
    	dfd = null;
    	dd.delete();
    	dd = null;
    	
    	return newJson;
    	} catch (Exception e) {
    		e.printStackTrace();
    		dfd.delete();
        	dfd = null;
        	dd.delete();
        	dd = null;
        	return null;
		}    	
    }
    
    
    
    private WebEditorDfd convertPCM(File usageModelFile, File allocationModelFile, File nodeCharacteristicsFile){
    	try {
    		var converter = new PCMConverter();
    		var dfd = converter.pcmToDFD("a", usageModelFile.toString(), allocationModelFile.toString(), nodeCharacteristicsFile.toString());		
    		
    		
    		var dfdConverter = new DataFlowDiagramConverter();
    		return dfdConverter.dfdToWeb(dfd);
    		
    	} catch (Exception e) {
			e.printStackTrace();
		}
    	return null;
    }
    
    
    private static WebEditorDfd analyzeAnnotateAndSafe(WebEditorDfd webEditorDfd) {
    	System.out.println("File received - Starting Analysis");
    	try {
    		var webEditorconverter = new WebEditorConverter();
        	var dd = webEditorconverter.webToDfd(webEditorDfd);
        	var dfdConverter = new DataFlowDiagramConverter();
        	var newJson = dfdConverter.dfdToWeb(dd);
        	return newJson;
		} catch (Exception e) {
			System.out.println("Error analyzing diagram. Verify validity");
		}
    	return null;
    }
    
    private static String convertToDFDandStringify(WebEditorDfd webEditorDfd, String name) {
    	try {
    		var converter = new WebEditorConverter();
    		var dfd = converter.webToDfd(webEditorDfd);
    		String tempDir = System.getProperty("java.io.tmpdir");
			var dfdFile = new File(tempDir, name + ".dataflowdiagram");
			var ddFile = new File(tempDir, name + ".datadictionary");
    		converter.storeDFD(dfd, dfdFile.getParent() + "/" + name);
    		
    		String dfdContent = Files.readString(dfdFile.toPath());
    		String ddContent = Files.readString(ddFile.toPath());

    		dfdFile.delete();
    		ddFile.delete();
    		return  dfdContent + "\n" + ddContent;
    		
    	} catch (Exception e) {
    		e.printStackTrace();
			return null;
		}
    }
    
    public static void shutDownFrontEnd() {
    	for (var sess : sessions.values()) {
    		try {
				sess.getRemote().sendString("Shutdown");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	}
    }
}