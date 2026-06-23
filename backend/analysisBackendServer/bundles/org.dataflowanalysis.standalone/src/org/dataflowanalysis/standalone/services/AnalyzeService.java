package org.dataflowanalysis.standalone.services;

import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.web2dfd.Web2DFDConverter;
import org.dataflowanalysis.converter.web2dfd.WebEditorConverterModel;

import com.fasterxml.jackson.core.JsonProcessingException;

public class AnalyzeService {
    /**
     * Analyzes a Model in WebEditor Json Representation and returns the analyzed Model
     * @param webEditorDfd Model to be analyzed
     * @return Analyzed Model
     * @throws JsonProcessingException 
     */
    public String analyzeAnnotate(String diagramMessage) throws JsonProcessingException {   
        var webEditorDfd = Util.deserializeJson(diagramMessage);
        
        var webEditorConverter = new Web2DFDConverter();
        var dd = webEditorConverter.convert(new WebEditorConverterModel(webEditorDfd));
        var dfdConverter = new DFD2WebConverter();
        if (webEditorDfd.constraints() != null && !webEditorDfd.constraints().isEmpty()) {                  
            var constraints = Util.parseConstraints(webEditorDfd);
            dfdConverter.setConstraints(constraints);
        }
        var newJson = dfdConverter.convert(dd).getModel();
        
        for (var child : newJson.model().children()) {
            if (child.type().startsWith("node") && child.annotations() != null) {
                var oldNode = webEditorDfd.model().children().stream().filter(node -> node.id().equals(child.id())).findAny().orElseThrow();
                //Necessary if ugly if we want to preserve custom annotations
                var annotationsToRemove = oldNode.annotations().stream().filter(a -> a.message().startsWith("Propagated") || a.message().startsWith("Incoming") || a.message().startsWith("Constraint")).toList();              
                oldNode.annotations().removeAll(annotationsToRemove);
                oldNode.annotations().addAll(child.annotations());
            }
        }       
        return Util.serializeJson(webEditorDfd);
    }
}
