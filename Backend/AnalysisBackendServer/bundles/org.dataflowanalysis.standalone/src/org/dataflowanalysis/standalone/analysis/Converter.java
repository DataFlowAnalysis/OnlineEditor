package org.dataflowanalysis.standalone.analysis;

import java.io.File;
import java.nio.file.Files;

import org.dataflowanalysis.analysis.dfd.core.DFDTransposeFlowGraphFinder;
import org.dataflowanalysis.analysis.dfd.simple.DFDSimpleTransposeFlowGraphFinder;
import org.dataflowanalysis.converter.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.DataFlowDiagramConverter;
import org.dataflowanalysis.converter.PCMConverter;
import org.dataflowanalysis.converter.WebEditorConverter;
import org.dataflowanalysis.converter.webdfd.WebEditorDfd;
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
}
