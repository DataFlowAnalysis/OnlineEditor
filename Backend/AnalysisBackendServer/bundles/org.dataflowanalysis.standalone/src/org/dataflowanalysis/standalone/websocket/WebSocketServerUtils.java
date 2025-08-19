package org.dataflowanalysis.standalone.websocket;

import java.time.Duration;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;

public class WebSocketServerUtils {
	public static Thread startWebSocketServer() {        
        Thread websocketServer =  new Thread(() -> startServer());
        websocketServer.start();
        
        return websocketServer;
	}
	
	private static void startServer() {		
		try {				 
			var server = new Server();
	        var connector = new ServerConnector(server);
	        server.addConnector(connector);

	        // Setup the basic application "context" for this application at "/"
	        // This is also known as the handler tree (in jetty speak)
	        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
	        context.setContextPath("/");
	        server.setHandler(context);
	        

	        // Configure specific websocket behavior
	        JettyWebSocketServletContainerInitializer.configure(context, (servletContext, wsContainer) ->
	        {
	            // Configure default max size
	            wsContainer.setMaxTextMessageSize(Long.MAX_VALUE);
	            wsContainer.setIdleTimeout(Duration.ofMinutes(60));

	            // Add websockets
	            wsContainer.addMapping("/events/*", WebSocketServerHandler.class);
	        });
	        connector.setPort(3000);
	        server.start();
	        server.join();
	        
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	
}
