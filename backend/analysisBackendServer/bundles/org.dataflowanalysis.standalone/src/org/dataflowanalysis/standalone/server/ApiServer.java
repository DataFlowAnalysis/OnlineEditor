package org.dataflowanalysis.standalone.server;

import java.net.InetSocketAddress;

import org.dataflowanalysis.standalone.api.AnalyzeServlet;
import org.dataflowanalysis.standalone.api.LoadDDServlet;
import org.dataflowanalysis.standalone.api.LoadPCMServlet;
import org.dataflowanalysis.standalone.api.SaveDDServlet;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;

public class ApiServer {
    public static void start() throws Exception {
        Server server = new Server(new InetSocketAddress("localhost", 3000));

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.NO_SESSIONS);
        context.setContextPath("/");

        context.addServlet(AnalyzeServlet.class, "/api/analyze");
        context.addServlet(LoadDDServlet.class, "/api/loadDD");
        context.addServlet(LoadPCMServlet.class, "/api/loadPCM");
        context.addServlet(SaveDDServlet.class, "/api/saveDD");        

        server.setHandler(context);
        server.start();
        server.join();
    }
}
