package org.dataflowanalysis.standalone.mitigation;

import java.io.IOException;
import java.util.List;

import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.web2dfd.Web2DFDConverter;
import org.dataflowanalysis.converter.web2dfd.WebEditorConverterModel;
import org.dataflowanalysis.converter.web2dfd.model.Annotation;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;
import org.dataflowanalysis.standalone.analysis.Converter;
import org.sat4j.specs.ContradictionException;
import org.sat4j.specs.TimeoutException;

import dev.arcovia.mitigation.sat.Mechanic;
import dev.arcovia.mitigation.sat.dsl.CNFTranslation;
import dev.arcovia.mitigation.smt.Mitigation;
import dev.arcovia.mitigation.ilp.OptimizationManager;
import tools.mdsd.library.standalone.initialization.StandaloneInitializationException;



public class MitigationAddon {
    public static WebEditorDfd repairDFD (WebEditorDfd webEditorDfd, String type) throws Exception {
       var webEditorconverter = new Web2DFDConverter();
        var dd = webEditorconverter.convert(new WebEditorConverterModel(webEditorDfd));
        var constraints = Converter.parseConstraints(webEditorDfd);
        
        DataFlowDiagramAndDictionary newDD;
        
        switch (type) {
            case "SAT": newDD = repairSAT(dd, constraints); break;
            case "SMT": newDD = repairSMT(dd, constraints); break;
            case "ILP": newDD = repairILP(dd, constraints); break;
            default: throw new IllegalArgumentException("Unknown Mitigation Type");
        }
       
        var dfdConverter = new DFD2WebConverter();
        dfdConverter.setConstraints(constraints);
        var newJson = dfdConverter.convert(newDD).getModel();
        
        for (var child : newJson.model().children()) {
            if (child.type().startsWith("node") && child.annotations() != null) {
                var oldNode = webEditorDfd.model().children().stream().filter(node -> node.id().equals(child.id())).findAny();
                if (oldNode.isPresent()) {
                    var RealOldNode = oldNode.get();
                    var behaviorstream1 = RealOldNode.ports().stream().filter(p -> p.behavior() != null).map(p -> p.behavior().trim()).toList();
                    var behaviorstream2 = child.ports().stream().filter(p -> p.behavior() != null).map(p -> p.behavior().trim()).toList();
                    if (!behaviorstream1.containsAll(behaviorstream2) || !behaviorstream2.containsAll(behaviorstream1)) {
                        child.annotations().add(new Annotation("Mitigation: Assignments modified", "bolt", "#68e362", 0)); //TODO TFG Number
                    }
                    
                    
                } else {
                    child.annotations().add(new Annotation("Mitigation: Node added for Mitigation", "bolt", "#68e362", 0)); //TODO TFG Number
                }
            }
        }    
        
        newJson.constraints().addAll(webEditorDfd.constraints());
        
        return Converter.analyzeAnnotate(newJson);
    }
    
    private static DataFlowDiagramAndDictionary repairSAT (DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints) throws ContradictionException, TimeoutException, IOException {
        var converted = constraints.stream()
                .map(CNFTranslation::new)
                .map(CNFTranslation::constructCNF)
                .flatMap(List::stream)
                .toList();
        
        Mechanic mechanic = new Mechanic(dd, null, converted);
        return mechanic.repair();        
    }
    
    private static DataFlowDiagramAndDictionary repairSMT (DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints) throws StandaloneInitializationException {
        var mitigationResult = Mitigation.run(dd, constraints, null);
        return mitigationResult.repairedDFD();
    }
    
    private static DataFlowDiagramAndDictionary repairILP (DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints) throws Exception {
        var optimization = new OptimizationManager(dd, constraints);
        return optimization.repair();
    }
}
