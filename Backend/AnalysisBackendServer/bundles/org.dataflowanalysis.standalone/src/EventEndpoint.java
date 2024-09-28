import java.util.concurrent.CountDownLatch;

import org.dataflowanalysis.converter.DataFlowDiagramConverter;
import org.dataflowanalysis.converter.webdfd.WebEditorDfd;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class EventEndpoint extends WebSocketAdapter
{
    private final CountDownLatch closureLatch = new CountDownLatch(1);
    private WebEditorDfd dfd;
    private Session sess;
   
    
    @Override
    public void onWebSocketConnect(Session sess)
    {
        super.onWebSocketConnect(sess);	
        System.out.println("Works");
        
        this.sess = sess;
    }

    @Override
    public void onWebSocketText(String message)
    {
    	var objectMapper = new ObjectMapper();
        super.onWebSocketText(message);
        try {
			dfd = objectMapper.readValue(message, WebEditorDfd.class);
			 objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
		     objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
		     dfd = analyzeAnnotateAndSafe(dfd);
		     sess.getRemote().sendString(objectMapper.writeValueAsString(dfd));
		     
		
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
    
    
    private static WebEditorDfd analyzeAnnotateAndSafe(WebEditorDfd webEditorDfd) {
    	System.out.println("File received - Starting Analysis");
    	var converter = new DataFlowDiagramConverter();
    	var dd = converter.webToDfd(webEditorDfd);
    	var newJson = converter.dfdToWeb(dd);
    	return newJson;
    }
}