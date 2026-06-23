package org.dataflowanalysis.standalone.services;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import org.dataflowanalysis.converter.web2dfd.Web2DFDConverter;
import org.dataflowanalysis.converter.web2dfd.WebEditorConverterModel;

public class SaveDDService {
    /**
     * Converts a model in WebEditor Json representation into the DFD metamodel representation and return the DFD files as a concatenated string
     * @param webEditorDfd model in WebEditor Json representation to be converted
     * @param name Name of the files to be created
     * @return Concatenation of DFD and DD files as string
     */
    public String convertToDFDandStringify(String diagramMessage, String name) {
        var webEditorDfd = Util.deserializeJson(diagramMessage);
        
        try {
            var converter = new Web2DFDConverter();
            var dfd = converter.convert(new WebEditorConverterModel(webEditorDfd));
            String tempDir = System.getProperty("java.io.tmpdir");
            var dfdFile = new File(tempDir, name + ".dataflowdiagram");
            var ddFile = new File(tempDir, name + ".datadictionary");
            dfd.save(dfdFile.getParent(), name);
            
            String dfdContent = Files.readString(dfdFile.toPath());
            String ddContent = Files.readString(ddFile.toPath());

            dfdFile.delete();
            ddFile.delete();
            return  dfdContent + "\n" + ddContent;
            
        } catch (IOException e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Invalid Model");
        }
    }
}
