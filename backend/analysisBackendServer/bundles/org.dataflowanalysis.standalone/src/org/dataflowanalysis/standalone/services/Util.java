package org.dataflowanalysis.standalone.services;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import org.apache.log4j.Logger;
import org.dataflowanalysis.analysis.dfd.dsl.DFDDSLContextProvider;
import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.analysis.utils.StringView;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class Util {
    private static final Logger logger = Logger.getLogger(Util.class);
    
    /**
     * Deserializes WebDFD
     * @param json Serialized WebDFD
     * @return Deserialized WebDFD
     */
    public static WebEditorDfd deserializeJson(String json){
        var objectMapper = new ObjectMapper();
        WebEditorDfd webEditorDfd;
        try {
            webEditorDfd = objectMapper.readValue(json, WebEditorDfd.class);
        } catch (IOException e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Invalid Json Model");
        } 
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        return webEditorDfd;
    }
    
    /**
     * Serializes a webDFD
     * @param webEditorDfd
     * @return Serialized WebDFD
     * @throws JsonProcessingException Should not happen in theory
     */
    public static String serializeJson(WebEditorDfd webEditorDfd) throws JsonProcessingException {
        var objectMapper = new ObjectMapper();
        return objectMapper.writeValueAsString(webEditorDfd);
    }
    
    /**
     * Takes the constraints from a WebDFD and turns them into AnalysisConstraint
     * @param webEditorDfd Full WebDFD
     * @return Converted AnalysisConstraints
     */
    public static List<AnalysisConstraint> parseConstraints(WebEditorDfd webEditorDfd) {
        return webEditorDfd.constraints().stream()
            .filter(it -> it.constraint() != null && !it.constraint().isEmpty())
            .map(it -> {
                StringView string = new StringView("- " + it.name() + ": " + it.constraint().replace("\n", ""));
                var constraint = AnalysisConstraint.fromString(string, new DFDDSLContextProvider());
                if (constraint.failed()) {
                    logger.error(constraint.getError());
                    throw new IllegalArgumentException("Unable to parse constraint: " + it.name());                     
                }
                var constraint2 = constraint.getResult();
                return constraint2;
            }).toList();            
    }
    
    /**
     * Saves the content as a temporary file for further processing
     * @param name Name of the temp file
     * @param content Content of the temp file
     * @return File Object
     * @throws IOException 
     */
    public static File createAndWriteTempFile(String name, String content) throws IOException {
        String tempDir = System.getProperty("java.io.tmpdir");
        var file = new File(tempDir, name);
        file.deleteOnExit();
        FileWriter fileWriter = new FileWriter(file);
        fileWriter.write(content);
        fileWriter.close();
        return file;
    }    
}
