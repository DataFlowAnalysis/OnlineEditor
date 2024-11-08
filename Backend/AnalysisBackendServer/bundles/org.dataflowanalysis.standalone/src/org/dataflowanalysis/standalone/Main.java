package org.dataflowanalysis.standalone;
import java.awt.Desktop;
import java.io.BufferedReader;
import java.io.File;

import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.URI;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;

import org.eclipse.jetty.server.ServerConnector;
import java.time.Duration;

public class Main {
	private static String editorPath = "resources\\WebEditor\\";
	private static final Path modelPath = Path.of("C:\\Users\\Huell\\Desktop\\Newfolder\\Testtest.json");  //Either path to existing model or future safe
	public static boolean status = true;
	
	private static BufferedReader reader;

	public static void main(String[] args) {		
		try {
			System.out.println(Main.class.getResource("\\resources\\WebEditor\\index.html"));
			runCommand("git init", editorPath);
            runCommand("npm.cmd install", editorPath);
            
            Thread frontEnd =  new Thread(() -> startFrontendServer());
            Thread webSocketServer =  new Thread(() -> startWebSocketServer());
            webSocketServer.start();
            frontEnd.start();
                        
            while(frontEnd.isAlive() || webSocketServer.isAlive());

        } catch (Exception e) {
            e.printStackTrace();
        }       

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
	            wsContainer.setIdleTimeout(Duration.ofSeconds(10000));

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
		 	String command = "npm.cmd run dev";
		 	System.out.println(command);
        	
            // Split the command into arguments for ProcessBuilder
            String[] commandParts = command.split(" ");

            ProcessBuilder builder = new ProcessBuilder(commandParts);
            
            builder.directory(new File(editorPath));// Inherit the I/O of the current process to show the server logs
           builder.inheritIO();
            // Start the process
            Process process = builder.start(); 
            var processReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            
            while (process.isAlive()) {
            	var line = processReader.readLine();
            	if ( line != null && line.contains("localhost")) {
            		openBrowser(line);
            		break;
            	} 
            	if (status == false) process.destroyForcibly();
            } 
            // Wait for the process to finish (optional, or you can log/process the output)
            int exitCode = process.waitFor();
            
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
	            	if (line.contains("localhost")) {
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
            Matcher matcher = pattern.matcher(full);

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
