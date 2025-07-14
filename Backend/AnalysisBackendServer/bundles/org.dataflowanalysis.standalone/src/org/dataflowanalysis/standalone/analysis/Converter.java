package org.dataflowanalysis.standalone.analysis;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

import org.apache.log4j.Logger;
import org.dataflowanalysis.analysis.dfd.simple.DFDSimpleTransposeFlowGraphFinder;
import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.analysis.utils.StringView;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.pcm2dfd.PCM2DFDConverter;
import org.dataflowanalysis.converter.pcm2dfd.PCMConverterModel;
import org.dataflowanalysis.converter.web2dfd.Web2DFDConverter;
import org.dataflowanalysis.converter.web2dfd.WebEditorConverterModel;
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

public class Converter {
    
    private static final Logger logger = Logger.getLogger(Converter.class);
	
	/**
	 * Convertes a DFD from the Ecore to the WebEditor Json representation
	 * @param dfd File where DFD is saved
	 * @param dd File where DD is saved
	 * @return Created WebEditor Json representation
	 */
 	public static WebEditorDfd convertDFD(File dfd, File dd){
    	var converter = new DFD2WebConverter();
    	
    	ResourceSet rs = new ResourceSetImpl();
		rs.getResourceFactoryRegistry().getExtensionToFactoryMap().put(Resource.Factory.Registry.DEFAULT_EXTENSION, new XMIResourceFactoryImpl());
		rs.getPackageRegistry().put(dataflowdiagramPackage.eNS_URI, dataflowdiagramPackage.eINSTANCE);
		rs.getPackageRegistry().put(datadictionaryPackage.eNS_URI, datadictionaryPackage.eINSTANCE);

		Resource ddResource = rs.getResource(URI.createFileURI(dd.toString()), true);		
		Resource dfdResource = rs.getResource(URI.createFileURI(dfd.toString()), true);
		EcoreUtil.resolveAll(rs);
		EcoreUtil.resolveAll(ddResource);
		EcoreUtil.resolveAll(dfdResource);
		DataFlowDiagramAndDictionary dfdAndDD = new DataFlowDiagramAndDictionary((DataFlowDiagram)dfdResource.getContents().get(0), (DataDictionary)ddResource.getContents().get(0));
		
		var newJson = converter.convert(dfdAndDD);		
    	
    	return newJson.getModel();	    			
    }
    
    
    /**
     * Convertes a Model in PCM representation into a WebEditor Json represenation
     * @param usageModelFile File where Usage Model is saved
     * @param allocationModelFile File where Allocation Model is saved
     * @param nodeCharacteristicsFile File where Node Characteristics Model is saved
     * @return Created WebEditor Json representation
     */
    public static WebEditorDfd convertPCM(File usageModelFile, File allocationModelFile, File nodeCharacteristicsFile){	    	
		var converter = new PCM2DFDConverter();
		var dfd = converter.convert(new PCMConverterModel(usageModelFile.toString(), allocationModelFile.toString(), nodeCharacteristicsFile.toString()));		
		
		
		var dfdConverter = new DFD2WebConverter();
		dfdConverter.setTransposeFlowGraphFinder(DFDSimpleTransposeFlowGraphFinder.class);
		return dfdConverter.convert(dfd).getModel();
    }
    
    /**
     * Analyzes a Model in WebEditor Json Representation and returns the analyzed Model
     * @param webEditorDfd Model to be analyzed
     * @return Analyzed Model
     */
    public static WebEditorDfd analyzeAnnotate(WebEditorDfd webEditorDfd) {	    	
		var webEditorconverter = new Web2DFDConverter();
    	var dd = webEditorconverter.convert(new WebEditorConverterModel(webEditorDfd));
    	var dfdConverter = new DFD2WebConverter();
    	if (webEditorDfd.constraints() != null && !webEditorDfd.constraints().isEmpty()) {	        		
    		var constraints = parseConstraints(webEditorDfd);
    		dfdConverter.setConditions(constraints);
    	}
    	var newJson = dfdConverter.convert(dd).getModel();
    	
    	for (var child : newJson.model().children()) {
    	    if (child.type().startsWith("node") && child.annotations() != null) {
    	        var oldNode = webEditorDfd.model().children().stream().filter(node -> node.id().equals(child.id())).findAny().orElseThrow();
    	        //Necessary if ugly if we want to preserver custom annotations
    	        var annotationsToRemove = oldNode.annotations().stream().filter(a -> a.message().startsWith("Propagated") || a.message().startsWith("Incoming") || a.message().startsWith("Constraint")).toList();   	        
    	        oldNode.annotations().removeAll(annotationsToRemove);
    	        oldNode.annotations().addAll(child.annotations());
    	    }
    	}    	
    	return webEditorDfd;
    }
    
    /**
     * Converts a model in WebEditor Json representation into the DFD metamodel representation and return the DFD files as a concatenated string
     * @param webEditorDfd model in WebEditor Json representation to be converted
     * @param name Name of the files to be created
     * @return Concatenation of DFD and DD files as string
     */
    public static String convertToDFDandStringify(WebEditorDfd webEditorDfd, String name) {
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
            return "Error";
        }
    }
    
    private static List<AnalysisConstraint> parseConstraints(WebEditorDfd webEditorDfd) {
    	return webEditorDfd.constraints().stream()
			.filter(it -> it.constraint() != null && !it.constraint().isEmpty())
			.map(it -> {
			    StringView string = new StringView("- " + it.name() + ": " + it.constraint().replace("\n", ""));
				var constraint = AnalysisConstraint.fromString(string);
				if (constraint.failed()) {
					logger.error(constraint.getError());
					throw new IllegalArgumentException("Unable to parse constraint: " + it.name());  					
				}
				var constraint2 = constraint.getResult();
				return constraint2;
			}).toList();	    	
    }
}
