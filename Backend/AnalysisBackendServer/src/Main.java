import java.awt.Desktop;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
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
	private static final Path modelPath = Path.of("C:\\Users\\Huell\\Desktop\\Test\\neu.json");  //Either path to existing model or future safe

	public static void main(String[] args) {		
		try {
            runCommand("npm.cmd install", editorPath);
            
            
            
            Thread backendThread = new Thread(() -> runCommand("node src/server.mjs " + modelPath.toString(), editorPath));
            Thread frontendThread = new Thread(() -> runCommand("npm.cmd run dev", editorPath));
            Thread fileSystemWatcher = new Thread(() -> watchFileChange(modelPath));
            
            // Start both threads
            frontendThread.start();
            backendThread.start();
            fileSystemWatcher.start();
            
            while (frontendThread.isAlive() || backendThread.isAlive()) {
            	
            }

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
                     if ((kind == ENTRY_MODIFY || kind == ENTRY_CREATE) && changedFile.equals(path.getFileName())) {
                         analyzeAnnotateAndSafe(path);     
                        break;                         
                     } 
                 }
                 key.cancel();
                 Thread.sleep(5000);
                 
                 path.getParent().register(watchService, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);

                 // Reset the key -- this step is crucial to receive further watch events
                 boolean valid = key.reset();
                 if (!valid) {
                     break;
                 }
             }
         } catch (Exception e) {
             e.printStackTrace();
         }
    }
    
    private static void analyzeAnnotateAndSafe(Path path) {
    	System.out.println("Received Model To analyze");
    	var converter = new DataFlowDiagramConverter();
    	var dd = converter.webToDfd(path.toString());
    	var newJson = converter.dfdToWeb(dd);
    	converter.storeWeb(newJson, path.toString());
    	System.out.println("Saved annotated model -> refresh WebEditor");
    }
}
