import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import org.dataflowanalysis.converter.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.DataFlowDiagramConverter;
import org.dataflowanalysis.converter.webdfd.WebEditorDfd;
import org.dataflowanalysis.dfd.datadictionary.DataDictionary;
import org.dataflowanalysis.dfd.datadictionary.datadictionaryPackage;
import org.dataflowanalysis.dfd.dataflowdiagram.DataFlowDiagram;
import org.dataflowanalysis.dfd.dataflowdiagram.dataflowdiagramPackage;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.util.EcoreUtil;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class EventEndpoint extends WebSocketAdapter
{
    private final CountDownLatch closureLatch = new CountDownLatch(1);
    private WebEditorDfd webEditorDfd;
    private List<Session> sessions = new ArrayList<>();
    private File dfd = null;
    private File dd = null;
   
    
    @Override
    public void onWebSocketConnect(Session sess)
    {
        super.onWebSocketConnect(sess);	
        System.out.println("Works");
        
        this.sessions.add(sess);
    }

    @Override
    public void onWebSocketText(String message)
    {
    	
        super.onWebSocketText(message);
        try {
			String returnMessage = handleIncomingMessage(message);
		    if (returnMessage != null) {
		    	for (var sess : sessions) {
		    		sess.getRemote().sendString(returnMessage);
		    	}
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
    
    private String handleIncomingMessage(String message) {
    	var objectMapper = new ObjectMapper();
    	WebEditorDfd newJson = null;
    	if (message.startsWith("Json:")) {
    		message = message.replaceFirst("Json:", "");
    		
    		try {
				webEditorDfd = objectMapper.readValue(message, WebEditorDfd.class);
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
    	else if (message.startsWith("DFD:")) {
    		message = message.replaceFirst("DFD:", "");
    		String name = message.split(":")[0];
    		message = message.replaceFirst(name + ":", "");
    		try {
                String tempDir = System.getProperty("java.io.tmpdir");
				dfd = new File(tempDir, name + ".dataflowdiagram");
				dfd.deleteOnExit();
				 FileWriter writer = new FileWriter(dfd);
				 writer.write(message);
				 writer.close();
				 if (dd != null)
					 newJson = convertDFD();
				 else return null;
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	}
    	else if (message.startsWith("DD:")) {
    		message = message.replaceFirst("DD:", "");
    		String name = message.split(":")[0];
    		message = message.replaceFirst(name + ":", "");
    		try {
                String tempDir = System.getProperty("java.io.tmpdir");
				dd = new File(tempDir, name + ".datadictionary");
				dd.deleteOnExit();
				 FileWriter writer = new FileWriter(dd);
				 writer.write(message);
				 writer.close();
				 if (dfd != null)
					 newJson = convertDFD();
				 else return null;
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	}
    	try {
			return objectMapper.writeValueAsString(newJson);
		} catch (JsonProcessingException e) {
			return null;
		}
    }
    
    private WebEditorDfd convertDFD(){
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
    }
    
    
    private static WebEditorDfd analyzeAnnotateAndSafe(WebEditorDfd webEditorDfd) {
    	System.out.println("File received - Starting Analysis");
    	var converter = new DataFlowDiagramConverter();
    	var dd = converter.webToDfd(webEditorDfd);
    	var newJson = converter.dfdToWeb(dd);
    	return newJson;
    }
}