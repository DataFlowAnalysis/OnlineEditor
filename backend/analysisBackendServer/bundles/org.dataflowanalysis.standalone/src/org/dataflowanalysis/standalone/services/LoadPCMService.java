package org.dataflowanalysis.standalone.services;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import org.dataflowanalysis.analysis.dfd.simple.DFDSimpleTransposeFlowGraphFinder;
import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.pcm2dfd.PCM2DFDConverter;
import org.dataflowanalysis.converter.pcm2dfd.PCMConverterModel;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;

public class LoadPCMService {
    /**
     * Takes a PCM model in serialized form, saves, loads and converts it into a WebDFD and serializes it
     * @param message
     * @return
     */
    public String safeLoadAndConvertPCMString(String message) {
        try {
            String[] files = message.split("---FILE---");
            
            File usageModelFile = null;
            File allocationFile = null;
            File nodeCharacteristicsFile = null;
            
            String randomFolder = UUID.randomUUID().toString(); 

            for (String fileSection : files) {
                fileSection = fileSection.trim();
                if (fileSection.isEmpty()) continue;

                int firstColon = fileSection.indexOf(":");
                if (firstColon == -1) continue; 

                String filename = fileSection.substring(0, firstColon);
                String fileContent = fileSection.substring(firstColon + 1);

                File file = Util.createAndWriteTempFile(filename, fileContent, randomFolder);
                
                if (filename.endsWith(".usagemodel")) {
                    usageModelFile = file;
                } else if (filename.endsWith(".allocation")) {
                    allocationFile = file;
                } else if (filename.endsWith(".nodecharacteristics")) {
                    nodeCharacteristicsFile = file;
                } 
            }
            return Util.serializeJson(convertPCM(usageModelFile, allocationFile, nodeCharacteristicsFile));
        } catch (IOException e) {           
            e.printStackTrace();
            throw new IllegalArgumentException("Invalid PCM Model");
        }
    }
    
    /**
     * Convertes a Model in PCM representation into a WebEditor Json represenation
     * @param usageModelFile File where Usage Model is saved
     * @param allocationModelFile File where Allocation Model is saved
     * @param nodeCharacteristicsFile File where Node Characteristics Model is saved
     * @return Created WebEditor Json representation
     */
    private WebEditorDfd convertPCM(File usageModelFile, File allocationModelFile, File nodeCharacteristicsFile){         
        var converter = new PCM2DFDConverter();
        try {
            var dfd = converter.convert(new PCMConverterModel(usageModelFile.toString(), allocationModelFile.toString(), nodeCharacteristicsFile.toString())); 
            var dfdConverter = new DFD2WebConverter();
            dfdConverter.setTransposeFlowGraphFinder(DFDSimpleTransposeFlowGraphFinder.class);
            return dfdConverter.convert(dfd).getModel();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid PCM Model");
        }        
    }
}
