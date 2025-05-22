package org.dataflowanalysis.standalone.analysis;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.awt.Color;
import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.dataflowanalysis.analysis.dfd.DFDDataFlowAnalysisBuilder;
import org.dataflowanalysis.analysis.dfd.resource.DFDModelResourceProvider;
import org.dataflowanalysis.analysis.dfd.simple.DFDSimpleTransposeFlowGraphFinder;
import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.analysis.dsl.result.DSLResult;
import org.dataflowanalysis.analysis.utils.StringView;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.pcm2dfd.PCM2DFDConverter;
import org.dataflowanalysis.converter.pcm2dfd.PCMConverterModel;
import org.dataflowanalysis.converter.web2dfd.Web2DFDConverter;
import org.dataflowanalysis.converter.web2dfd.WebEditorConverterModel;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;
import org.dataflowanalysis.converter.web2dfd.model.Child;
import org.dataflowanalysis.converter.web2dfd.model.Annotation;
import org.dataflowanalysis.dfd.datadictionary.DataDictionary;
import org.dataflowanalysis.dfd.datadictionary.datadictionaryPackage;
import org.dataflowanalysis.dfd.dataflowdiagram.DataFlowDiagram;
import org.dataflowanalysis.dfd.dataflowdiagram.Node;
import org.dataflowanalysis.dfd.dataflowdiagram.dataflowdiagramPackage;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.util.EcoreUtil;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;

public class Converter {

    private static final Logger logger = Logger.getLogger(AnalysisConstraint.class);
	
    	/**
    	 * Convertes a DFD from the Ecore to the WebEditor Json representation
    	 * @param dfd File where DFD is saved
    	 * @param dd File where DD is saved
    	 * @return Created WebEditor Json representation
    	 */
	 	public static WebEditorDfd convertDFD(File dfd, File dd){
	    	try {
		    	var converter = new DFD2WebConverter();
		    	
		    	ResourceSet rs = new ResourceSetImpl();
				rs.getResourceFactoryRegistry().getExtensionToFactoryMap().put(Resource.Factory.Registry.DEFAULT_EXTENSION, new XMIResourceFactoryImpl());
				rs.getPackageRegistry().put(dataflowdiagramPackage.eNS_URI, dataflowdiagramPackage.eINSTANCE);
				rs.getPackageRegistry().put(datadictionaryPackage.eNS_URI, datadictionaryPackage.eINSTANCE);
	
				Resource ddResource = rs.getResource(URI.createFileURI(dd.toString()), true);		
				Resource dfdResource = rs.getResource(URI.createFileURI(dfd.toString()), true);
				System.out.println(dd.toString());
				System.out.println(dfd.toString());
				EcoreUtil.resolveAll(rs);
				EcoreUtil.resolveAll(ddResource);
				EcoreUtil.resolveAll(dfdResource);
				DataFlowDiagramAndDictionary dfdAndDD = new DataFlowDiagramAndDictionary((DataFlowDiagram)dfdResource.getContents().get(0), (DataDictionary)ddResource.getContents().get(0));
				
				var newJson = converter.convert(dfdAndDD);		
		    	
		    	return newJson.getModel();
		    	
	    	} catch (Exception e) {
	    		e.printStackTrace();
	        	return null;
			}  	 		
	    }
	    
	    
	    /**
	     * Convertes a Model in PCM representation into a WebEditor Json represenation
	     * @param usageModelFile File where Usage Model is saved
	     * @param allocationModelFile File where Allocation Model is saved
	     * @param nodeCharacteristicsFile File where Node Characteristics Model is saved
	     * @return Created WebEditor Json representation
	     */
	    public static WebEditorDfd convertPCM(File usageModelFile, File allocationModelFile, File nodeCharacteristicsFile){
	    	try {
	    		var converter = new PCM2DFDConverter();
	    		var dfd = converter.convert(new PCMConverterModel(usageModelFile.toString(), allocationModelFile.toString(), nodeCharacteristicsFile.toString()));		
	    		
	    		
	    		var dfdConverter = new DFD2WebConverter();
	    		dfdConverter.setTransposeFlowGraphFinder(DFDSimpleTransposeFlowGraphFinder.class);
	    		return dfdConverter.convert(dfd).getModel();
	    		
	    	} catch (Exception e) {
				e.printStackTrace();
			}
	    	return null;
	    }
	    
	    /**
	     * Analyzes a Model in WebEditor Json Representation and returns the analyzed Model
	     * @param webEditorDfd Model to be analyzed
	     * @return Analyzed Model
	     */
	    public static WebEditorDfd analyzeAnnotate(WebEditorDfd webEditorDfd) {
	    	try {
	    		var webEditorconverter = new Web2DFDConverter();
	        	var dd = webEditorconverter.convert(new WebEditorConverterModel(webEditorDfd));
	        	var dfdConverter = new DFD2WebConverter();
	        	if (webEditorDfd.constraints() != null && !webEditorDfd.constraints().isEmpty()) {	        		
	        		var constraints = parseConstraints(webEditorDfd);
	        		dfdConverter.setConditions(constraints);
	        	}
	        	var newJson = dfdConverter.convert(dd).getModel();
	        	if (webEditorDfd.constraints() != null && !webEditorDfd.constraints().isEmpty()) 
	        		newJson.constraints().addAll(webEditorDfd.constraints()); //Reapply constraints
	        	return newJson;
			} catch (Exception e) {
				e.printStackTrace();
			}
	    	return null;
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
	    		
	    	} catch (Exception e) {
	    		e.printStackTrace();
				return null;
			}
	    }
	    
	    private static List<AnalysisConstraint> parseConstraints(WebEditorDfd webEditorDfd) {
	    	return webEditorDfd.constraints().stream()
    			.filter(it -> it.constraint() != null && !it.constraint().isEmpty())
    			.map(it -> {
    				var constraint = AnalysisConstraint.fromString(new StringView(it.constraint())).getResult();
    				constraint.setName(it.name());
    				return constraint;
    			}).toList();	    	
	    }
	    
	    private static List<DSLResult> runAnalysis(DataFlowDiagramAndDictionary dfd, List<AnalysisConstraint> constraints) {
	    	var analysis = new DFDDataFlowAnalysisBuilder()
	    			.standalone()
	    			.modelProjectName(" ")
	    			.useCustomResourceProvider(new DFDModelResourceProvider(dfd.dataDictionary(), dfd.dataFlowDiagram()))
	    			.build();
	    	

	        logger.setLevel(Level.DEBUG);
	    	
	    	var tfg = analysis.findFlowGraphs();
	    	tfg.evaluate();
	    	
	    	
	    	return constraints.stream().flatMap(it -> it.findViolations(tfg).stream()).toList();
	    }
	    
	    private static WebEditorDfd annotateViolations(WebEditorDfd webEditorDfd, List<DSLResult> violations) {
	    	Map<Child, List<Annotation>> nodeToAnnotationMap = new HashMap<>();
	    	
	    	for (int i = 0; i < violations.size(); i++) {
	    		var violation = violations.get(i);
	    		violation.getMatchedVertices().stream().forEach(it -> {
	    			var node = webEditorDfd.model().children().stream()
	    					.filter(child -> child.id().equals(((Node)it.getReferencedElement()).getId())).findFirst().orElseThrow();
	    			nodeToAnnotationMap.putIfAbsent(node, new ArrayList<>());
	    			String message = "Constraint " + violation.getName() + " violated";
    				nodeToAnnotationMap.get(node).add(new Annotation(message, "bolt", stringToColorHex(message), violation.getTransposeFlowGraph().hashCode()));
	    		});
	    	}
	    	
	    	List<Child> newChildren = new ArrayList<>();
	    	
	    	for (Child child : webEditorDfd.model().children()) {
	    		if (nodeToAnnotationMap.containsKey(child)) {
	    			var annotations = child.annotations();
	    			
	    			annotations.addAll(nodeToAnnotationMap.get(child));
	    			
	    			var newChild = new Child(child.text(), child.labels(), child.ports(), child.id(), child.type(), null, null, annotations, child.children());
	    			newChildren.add(newChild);	    			
	    		}
	    	}
	    	
	    	var nodesToRemove = new ArrayList<Child>();
	    	
	    	nodeToAnnotationMap.keySet().forEach(node -> {
	    		for (Child child : webEditorDfd.model().children()) {
	    			if (child.id().equals(node.id())) {
	    				nodesToRemove.add(child);
	    				break;
	    			}
	    		}	    		
	    	});
	    	
	    	webEditorDfd.model().children().removeAll(nodesToRemove);
	    	webEditorDfd.model().children().addAll(newChildren);
	    	
	    	return webEditorDfd;
	    }
	    
	    private static String stringToColorHex(String input) {
	        byte[] hash;
	        try {
	            MessageDigest md = MessageDigest.getInstance("MD5");
	            hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
	        } catch (NoSuchAlgorithmException e) {
	            hash = new byte[] {(byte)0x80, (byte)0x80, (byte)0x80, 0};
	        }
	        float hue = (hash[0] & 0xFF) / 255f;
	        float saturation = 0.5f + ((hash[1] & 0xFF) / 255f) * 0.5f;
	        float brightness = 0.3f + ((hash[2] & 0xFF) / 255f) * 0.5f;
	        saturation = Math.max(0.5f, Math.min(saturation, 1.0f));
	        brightness = Math.max(0.3f, Math.min(brightness, 0.8f));
	        Color color = Color.getHSBColor(hue, saturation, brightness);
	        return String.format("#%02X%02X%02X", color.getRed(), color.getGreen(), color.getBlue());
	    }
}
