package org.dataflowanalysis.standalone.frontend;

import java.awt.Desktop;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.dataflowanalysis.standalone.websocket.WebSocketServerUtils;
import org.eclipse.core.runtime.FileLocator;
import org.eclipse.core.runtime.IPath;
import org.eclipse.core.runtime.Path;
import org.eclipse.core.runtime.Platform;
import org.osgi.framework.Bundle;

public class FrontendUtils {
	private static String editorPath = "resources\\WebEditor\\";
	private static final String npmCommand = System.getProperty("os.name").toLowerCase().contains("win") ? "npm.cmd" : "npm";
	
	public static Thread startFrontendServer() {
		runCommand("git init", editorPath);
        runCommand(npmCommand + " install", editorPath);
        
        Thread frontEnd =  new Thread(() -> startServer());
        frontEnd.start();
        
        return frontEnd;
	}
	
	public static void stopFrontendServer() {
		WebSocketServerUtils.shutDownFrontend();
	}
	
	public static Thread startFrontendServerForApplication() throws IOException{
		Bundle bundle = Platform.getBundle("org.dataflowanalysis.standalone");

		IPath path = new Path("");

		URL url = FileLocator.find(bundle, path, null);
		URL fileUrl = FileLocator.toFileURL(url);

		editorPath = fileUrl.getPath().toString() + "WebEditor/";
        
        return startFrontendServer();
	}

	private static void startServer() {
		 try {
		 	String command = npmCommand + " run dev";
		 	System.out.println(command);
        	
            // Split the command into arguments for ProcessBuilder
            String[] commandParts = command.split(" ");

            ProcessBuilder builder = new ProcessBuilder(commandParts);
            
            builder.directory(new File(editorPath));// Inherit the I/O of the current process to show the server logs
            
            //builder.inheritIO(); //Activate for debugging, disables auto Browser opening
            
            // Start the process
            Process process = builder.start(); 
            var processReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            
            while (process.isAlive()) {
            	var line = processReader.readLine();
            	if ( line != null && line.contains("localhost")) {
            		openBrowser(line);
            		break;
            	} 
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
            // Wait for the process to finish (optional, or you can log/process the output)
            int exitCode = process.waitFor();
            System.out.println("\"" + command + "\" exited with code: " + exitCode);
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
