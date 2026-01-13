package com.antigravity;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

public class App {
    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            // Check if running from root or server directory
            String clientPath = "client/dist/client";
            if (!java.nio.file.Files.exists(java.nio.file.Paths.get(clientPath))) {
                clientPath = "../client/dist/client";
            }
            config.addStaticFiles(clientPath, Location.EXTERNAL);
            config.enableCorsForAllOrigins();
        }).start(7070);

        app.get("/api/hello", ctx -> ctx.result("Hello from Java Server"));
    }
}
