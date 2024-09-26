import java.awt.Desktop;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.io.BufferedWriter;
import java.net.URI;
import java.nio.file.*;
import java.nio.file.Path;
import java.nio.file.WatchService;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.dataflowanalysis.converter.DataFlowDiagramConverter;
import org.dataflowanalysis.analysis.dfd.core.DFDVertex;

import static java.nio.file.StandardWatchEventKinds.*;

public class Main {
	private static final String editorPath = "resources\\WebEditor\\";
	private static final Path modelPath = Path.of("C:\\Users\\Huell\\Desktop\\Newfolder\\Test.json");  //Either path to existing model or future safe
	private static Thread frontEndServer;

	public static void main(String[] args) {		
		try {
			runCommand("git init", editorPath);
            runCommand("npm.cmd install", editorPath);
            
            
            
            Thread backendThread = new Thread(() -> {
            	 String port = startBackendServerEndReturnPort();
                 if (port != null) {
                	 startFrontendServer(port);
                 } else {
                     System.err.println("Failed to start backend server");
                 }
            });
            Thread fileSystemWatcher = new Thread(() -> watchFileChange(modelPath));
            
            
            
            
            backendThread.start();
            fileSystemWatcher.start();
            
            while (backendThread.isAlive()) {
            	
            }

        } catch (Exception e) {
            e.printStackTrace();
        }       

	}

	private static void startFrontendServer(String backendServerPort) {
		 try {
			createEnvFile(backendServerPort);
		 	String command = "npm.cmd run dev";
		 	System.out.println(command);
        	
            // Split the command into arguments for ProcessBuilder
            String[] commandParts = command.split(" ");

            ProcessBuilder builder = new ProcessBuilder(commandParts);
            
            builder.directory(new File(editorPath));// Inherit the I/O of the current process to show the server logs
            
            
            // Start the process
            Process process = builder.start(); 
            var processReader = new BufferedReader(new InputStreamReader(process.getInputStream()));	           
            while (process.isAlive()) {
            	var line = processReader.readLine();
            	if ( line != null && line.contains("Local")) {
            		openBrowser(line);
            	}
            }    	            
            // Wait for the process to finish (optional, or you can log/process the output)
            int exitCode = process.waitFor();
            System.out.println("Process exited with code: " + exitCode);
        } catch (Exception e) {
            e.printStackTrace();
        }
	}
	
	public static void createEnvFile(String backendPort) {
        // Define the path to the .env file (in your project root directory)
        String envFilePath = "resources/WebEditor/.env";
        
        // Define the content to write (setting VITE_BACKEND_PORT)
        String content = "VITE_BACKEND_PORT=" + backendPort;

        // Create a new file object
        File envFile = new File(envFilePath);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(envFile))) {
            // Write the content to the .env file
            writer.write(content);
            System.out.println(".env file created/updated with backend port: " + backendPort);
        } catch (Exception e) {
            System.err.println("Error while writing to .env file: " + e.getMessage());
        }
    }
	
	private static String startBackendServerEndReturnPort() {
		try {
			String command = "node src/server.mjs " + modelPath.toString();
			String[] commandParts = command.split(" ");
	
	        ProcessBuilder builder = new ProcessBuilder(commandParts);
	        
	        builder.directory(new File(editorPath));
	        //builder.inheritIO();// Inherit the I/O of the current process to show the server logs
	       
	        Process process = builder.start(); 
	        var processReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
	        Pattern pattern = Pattern.compile("http://localhost:(\\d+)");
	        String line;
            // Read the process output line by line
	        while (process.isAlive()) {
	            while ((line = processReader.readLine()) != null) {
	                Matcher matcher = pattern.matcher(line);
	                if (matcher.find()) {
	                    // Return the port number if a match is found
	                    return matcher.group(1);
	                }
	            }
	        } 
            return "3002";
		} catch (Exception e) {
			System.err.println("Error starting Backend Server");
			return "3002";
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

    private static void watchFileChange(Path path) {
    	 try {
             // Create the WatchService
             WatchService watchService = FileSystems.getDefault().newWatchService();

             // Register the directory with the watch service for specific events
             path.getParent().register(watchService, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);

             System.out.println("Watching directory: " + path);

             // Infinite loop to keep the listener running
             while (true) {
                 // Wait for a watch key to be available
                 WatchKey key = watchService.take();

                 // Iterate through the events
                 for (WatchEvent<?> event : key.pollEvents()) {
                	 
                     WatchEvent.Kind<?> kind = event.kind();   
                     Path changedFile = (Path) event.context();
                     if (kind == ENTRY_MODIFY && changedFile.equals(path.getFileName())) {
                         analyzeAnnotateAndSafe(path);     
                        break;                         
                     } 
                 }
                 key.cancel();
                 Thread.sleep(5000);
                 
                 path.getParent().register(watchService, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);
                 key = watchService.take();
                 // Reset the key -- this step is crucial to receive further watch events
                 boolean valid = key.reset();
                 if (!valid) {
                     break;
                 }
             }
             System.out.println("Over and out");
         } catch (Exception e) {
             e.printStackTrace();
         }
    }
    
    private static void analyzeAnnotateAndSafe(Path path) {
    	System.out.println("File received - Starting Analysis");
    	var converter = new DataFlowDiagramConverter();
    	var dd = converter.webToDfd(path.toString());
    	var newJson = converter.dfdToWeb(dd);
    	converter.storeWeb(newJson, path.toString());
    	System.out.println("File saved - Refresh Editor");
    }
}
