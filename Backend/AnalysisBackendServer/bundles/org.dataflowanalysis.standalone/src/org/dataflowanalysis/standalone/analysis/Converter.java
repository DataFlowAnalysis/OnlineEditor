package org.dataflowanalysis.standalone.analysis;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.dataflowanalysis.analysis.dfd.DFDDataFlowAnalysisBuilder;
import org.dataflowanalysis.analysis.dfd.resource.DFDModelResourceProvider;
import org.dataflowanalysis.analysis.dfd.simple.DFDSimpleTransposeFlowGraphFinder;
import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.analysis.dsl.constraint.ConstraintDSL;
import org.dataflowanalysis.analysis.dsl.result.DSLResult;
import org.dataflowanalysis.analysis.utils.StringView;
import org.dataflowanalysis.converter.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.DataFlowDiagramConverter;
import org.dataflowanalysis.converter.PCMConverter;
import org.dataflowanalysis.converter.WebEditorConverter;
import org.dataflowanalysis.converter.webdfd.WebEditorDfd;
import org.dataflowanalysis.converter.webdfd.Child;
import org.dataflowanalysis.converter.webdfd.Annotation;
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
	
	 	public static WebEditorDfd convertDFD(File dfd, File dd){
	    	try {
		    	var converter = new DataFlowDiagramConverter();
		    	
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
				
				var newJson = converter.dfdToWeb(dfdAndDD);		
		    	
		    	return newJson;
		    	
	    	} catch (Exception e) {
	    		e.printStackTrace();
	        	return null;
			}  	 		
	    }
	    
	    
	    
	    public static WebEditorDfd convertPCM(File usageModelFile, File allocationModelFile, File nodeCharacteristicsFile){
	    	try {
	    		var converter = new PCMConverter();
	    		var dfd = converter.pcmToDFD("a", usageModelFile.toString(), allocationModelFile.toString(), nodeCharacteristicsFile.toString());		
	    		
	    		
	    		var dfdConverter = new DataFlowDiagramConverter();
	    		return dfdConverter.dfdToWebAndAnalyzeAndAnnotateWithCustomTFGFinder(dfd, null, DFDSimpleTransposeFlowGraphFinder.class);
	    		
	    	} catch (Exception e) {
				e.printStackTrace();
			}
	    	return null;
	    }
	    
	    
	    public static WebEditorDfd analyzeAnnotate(WebEditorDfd webEditorDfd) {
	    	try {
	    		var webEditorconverter = new WebEditorConverter();
	        	var dd = webEditorconverter.webToDfd(webEditorDfd);
	        	var dfdConverter = new DataFlowDiagramConverter();
	        	var newJson = dfdConverter.dfdToWeb(dd);
	        	if (webEditorDfd.constraints() != null && !webEditorDfd.constraints().isEmpty()) {
	        		var constraints = parseConstraints(webEditorDfd);
	        		var violations = runAnalysis(dd, constraints);
	        		return annotateViolations(newJson, violations);
	        	}
	        	return newJson;
			} catch (Exception e) {
				e.printStackTrace();
			}
	    	return null;
	    }
	    
	    public static String convertToDFDandStringify(WebEditorDfd webEditorDfd, String name) {
	    	try {
	    		var converter = new WebEditorConverter();
	    		var dfd = converter.webToDfd(webEditorDfd);
	    		String tempDir = System.getProperty("java.io.tmpdir");
				var dfdFile = new File(tempDir, name + ".dataflowdiagram");
				var ddFile = new File(tempDir, name + ".datadictionary");
	    		converter.storeDFD(dfd, dfdFile.getParent() + "/" + name);
	    		
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
	    	/*return webEditorDfd.constraints().stream().map(it -> {
	    		return AnalysisConstraint.fromString(new StringView(it.constraint())).getResult();
	    	}).toList();*/
	    	
	    	var constraint = new ConstraintDSL()
	                .ofData()
	                .withLabel("Sensitivity", List.of("Personal"))
	                .fromNode()
	                .neverFlows()
	                .toVertex()
	                .withCharacteristic("Location", "nonEU")
	                .create();
	    	System.out.println(constraint);
	    	constraint = AnalysisConstraint.fromString(new StringView(constraint.toString())).getResult();

	        logger.setLevel(Level.TRACE);
	    	
	    	var list = new ArrayList<AnalysisConstraint>();
	    	list.add(constraint);
	    	return list;
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
	    	Map<Child, String> nodeToAnnotationMap = new HashMap<>();
	    	
	    	for (int i = 0; i < violations.size(); i++) {
	    		final int index = i;
	    		violations.get(i).getMatchedVertices().stream().forEach(it -> {
	    			var node = webEditorDfd.model().children().stream()
	    					.filter(child -> child.id().equals(((Node)it.getReferencedElement()).getId())).findFirst().orElseThrow();
	    			var annotation = "";
	    			if (nodeToAnnotationMap.containsKey(node)) {
	    				annotation = nodeToAnnotationMap.get(node);
	    				annotation += "\n";	    				
	    			}
	    			annotation += "Constraint " + index + " violated";
	    			nodeToAnnotationMap.put(node, annotation);
	    		});
	    	}
	    	
	    	List<Child> newChildren = new ArrayList<>();
	    	
	    	for (Child child : webEditorDfd.model().children()) {
	    		if (nodeToAnnotationMap.containsKey(child)) {
	    			StringBuilder builder = new StringBuilder();
	    			builder.append(child.annotation().toString());
	    			if (builder.toString() != "") builder.append("\n");
	    			builder.append(nodeToAnnotationMap.get(child));
	    			
	    			var annotation = new Annotation(builder.toString(), "bolt", "#ff0000");
	    			
	    			var newChild = new Child(child.text(), child.labels(), child.ports(), child.id(), child.type(), null, null,annotation, child.children());
	    			newChildren.add(newChild);	    			
	    		}
	    	}
	    	
	    	webEditorDfd.model().children().removeAll(nodeToAnnotationMap.keySet());
	    	webEditorDfd.model().children().addAll(newChildren);
	    	
	    	return webEditorDfd;
	    }
	    
	   
}
