package org.dataflowanalysis.standalone;


import org.dataflowanalysis.standalone.server.ApiServer;

public class Main {
	public static void main(String[] args) {		
		try {			       
           ApiServer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
	}
}
