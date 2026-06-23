package org.dataflowanalysis.standalone.services;

import java.io.File;
import java.util.UUID;

import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;
import org.dataflowanalysis.dfd.datadictionary.DataDictionary;
import org.dataflowanalysis.dfd.datadictionary.datadictionaryPackage;
import org.dataflowanalysis.dfd.dataflowdiagram.DataFlowDiagram;
import org.dataflowanalysis.dfd.dataflowdiagram.dataflowdiagramPackage;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.util.EcoreUtil;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;

public class LoadDDService {
    
    /**
     * Takes the DFD and DD in serialized form, saves them temporarily, then loads and converts them into an WebDFD and serialzes it
     * @param diagramMessage Serialized DFD and DD
     * @param name Name of the DFD and DD
     * @return Serialized WebJson
     */
    public String safeLoadAndConvertDFDString(String diagramMessage, String name) {
        String[] parts = diagramMessage.split("\\R:DD:\\R", 2);

        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid DFD message: missing ':DD:' separator");
        }

        String dfdMessage = parts[0];
        String ddMessage = parts[1];
        
        String randomFolder = UUID.randomUUID().toString(); 
        
        try {            
            var dfd = Util.createAndWriteTempFile(name + ".dataflowdiagram", dfdMessage, randomFolder);
            var dd = Util.createAndWriteTempFile(name + ".datadictionary", ddMessage, randomFolder);
            return Util.serializeJson(convertDFD(dfd, dd));
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Invalid DFD Model");
        }
    }
    
    /**
     * Convertes a DFD from the Ecore to the WebEditor Json representation
     * @param dfd File where DFD is saved
     * @param dd File where DD is saved
     * @return Created WebEditor Json representation
     */
    private WebEditorDfd convertDFD(File dfd, File dd){
        var converter = new DFD2WebConverter();        
        ResourceSet resourceSet = new ResourceSetImpl();
        resourceSet.getResourceFactoryRegistry().getExtensionToFactoryMap().put(Resource.Factory.Registry.DEFAULT_EXTENSION, new XMIResourceFactoryImpl());
        resourceSet.getPackageRegistry().put(dataflowdiagramPackage.eNS_URI, dataflowdiagramPackage.eINSTANCE);
        resourceSet.getPackageRegistry().put(datadictionaryPackage.eNS_URI, datadictionaryPackage.eINSTANCE);

        Resource ddResource = resourceSet.getResource(URI.createFileURI(dd.toString()), true);       
        Resource dfdResource = resourceSet.getResource(URI.createFileURI(dfd.toString()), true);
        EcoreUtil.resolveAll(resourceSet);
        EcoreUtil.resolveAll(ddResource);
        EcoreUtil.resolveAll(dfdResource);
        DataFlowDiagramAndDictionary dfdAndDD = new DataFlowDiagramAndDictionary((DataFlowDiagram)dfdResource.getContents().get(0), (DataDictionary)ddResource.getContents().get(0));
        
        var newJson = converter.convert(dfdAndDD);      
        
        return newJson.getModel();                  
    }
    
    
}
