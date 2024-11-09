package org.dataflowanalysis.standalone;

import java.awt.Desktop;
import java.io.BufferedReader;
import java.io.File;
import java.util.Scanner;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URL;
import org.eclipse.core.runtime.Path;
import java.time.Duration;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.eclipse.core.runtime.FileLocator;
import org.eclipse.core.runtime.IPath;
import org.eclipse.core.runtime.Platform;
import org.eclipse.equinox.app.IApplication;
import org.eclipse.equinox.app.IApplicationContext;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;
import org.osgi.framework.Bundle;

public class Application implements IApplication {
	private static String editorPath = "WebEditor/";
	
	private static BufferedReader reader;
	
	private static Process frontEnd;
	private static Thread webSocketServer;
	private static final String npmCommand = System.getProperty("os.name").toLowerCase().contains("win") ? "npm.cmd" : "npm";


	@Override
	public Object start(IApplicationContext context) throws Exception {
		
		try {			
			Bundle bundle = Platform.getBundle("org.dataflowanalysis.standalone");

			IPath path = new Path("");

			URL url = FileLocator.find(bundle, path, null);
			URL fileUrl = FileLocator.toFileURL(url);

			editorPath = fileUrl.getPath().toString() + "WebEditor/";
			
			System.out.println(editorPath);
			
			runCommand("git init", editorPath);
            runCommand(npmCommand + " install", editorPath);
            
            Thread frontEnd =  new Thread(() -> startFrontendServer());
            webSocketServer =  new Thread(() -> startWebSocketServer());
            webSocketServer.start();
            frontEnd.start();
            
           
            Scanner scanner = new Scanner(System.in);
            String input = "";

            System.out.println("Type 'exit' to quit the program.");

            // Loop until user types "exit"
            
            
            while(frontEnd.isAlive() || webSocketServer.isAlive()) {
            	while (!input.equalsIgnoreCase("exit")) {
                    input = scanner.nextLine();
                } 
                EventEndpoint.shutDownFrontEnd();	
                return IApplication.EXIT_OK;
                
            };

        } catch (Exception e) {
            e.printStackTrace();
        }      
		return IApplication.EXIT_OK;
	}

	@Override
	public void stop() {
		EventEndpoint.shutDownFrontEnd();		
	}
	
	private static void startWebSocketServer() {		
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
	            wsContainer.setIdleTimeout(Duration.ofMinutes(20));

	            // Add websockets
	            wsContainer.addMapping("/events/*", EventEndpoint.class);
	        });
	        connector.setPort(3000);
	        server.start();
	        server.join();
	        
			
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private static void startFrontendServer() {
		 try {
		 	String command = npmCommand + " run dev";
		 	System.out.println(command);
        	
            // Split the command into arguments for ProcessBuilder
            String[] commandParts = command.split(" ");

            ProcessBuilder builder = new ProcessBuilder(commandParts);
            
            builder.directory(new File(editorPath));// Inherit the I/O of the current process to show the server logs
            
            
            // Start the process
            frontEnd = builder.start(); 
            var processReader = new BufferedReader(new InputStreamReader(frontEnd.getInputStream()));
            
            while (frontEnd.isAlive()) {
            	var line = processReader.readLine();
            	if ( line != null && line.contains("local")) {
            		openBrowser(line);
            	} 
            }    	            
            // Wait for the process to finish (optional, or you can log/process the output)
            int exitCode = frontEnd.waitFor();
            System.out.println("Process exited with code: " + exitCode);
        } catch (Exception e) {
            e.printStackTrace();
        }
	}
	
	
	
	// Method to run the command using ProcessBuilder
    private static void runCommand(String command, String projectPath) {
        try {
        	System.out.println(command);    
        	
            // Split the command into arguments for ProcessBuilder
            String[] commandParts = command.split(" ");

            ProcessBuilder builder = new ProcessBuilder(commandParts);
            
            
            builder.directory(new File(projectPath));// Inherit the I/O of the current process to show the server logs
           
            
            // Start the process
            Process process = builder.start(); 
            var processReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            if (command.startsWith("npm.cmd run")) {
	            while (process.isAlive()) {
	            	var line = processReader.readLine();
	            	if (line.contains("Local")) {
	            		openBrowser(line);
	            	}
	            }    
            }
            // Wait for the process to finish (optional, or you can log/process the output)
            int exitCode = process.waitFor();
            System.out.println("Process exited with code: " + exitCode);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }    
    
    private static void openBrowser(String full) {
    	try {
    		String ansiRegex = "\\u001B\\[[;\\d]*m";
            String cleanedLine = full.replaceAll(ansiRegex, "");

            // Define a regex to extract the port number
            String regex = "http://localhost:(\\d+)/";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(cleanedLine);

            // Check if the pattern matches and extract the port
            if (matcher.find()) {
            	var url2 = new URI(matcher.group(0));
    			// Check if Desktop is supported
    	        if (Desktop.isDesktopSupported()) {
    	            // Get the desktop instance and open the URL in the default browser
    	            Desktop desktop = Desktop.getDesktop();
    	            if (desktop.isSupported(Desktop.Action.BROWSE)) {
    	                desktop.browse(url2);
    	            } else {
    	                System.out.println("Browsing not supported on this platform.");
    	            }
    	        } else {
    	            System.out.println("Desktop is not supported on this platform.");
    	        }  // Extract the first matching group (the port number)
            } else {
                System.out.println("No port found in the input.");
            }
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }

}
