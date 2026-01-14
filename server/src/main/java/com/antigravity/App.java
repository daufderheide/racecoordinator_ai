package com.antigravity;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import com.antigravity.proto.HelloRequest;
import com.antigravity.proto.HelloResponse;
import com.google.protobuf.InvalidProtocolBufferException;

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

        app.post("/api/proto-hello", ctx -> {
            try {
                HelloRequest request = HelloRequest.parseFrom(ctx.bodyAsBytes());
                HelloResponse response = HelloResponse.newBuilder()
                        .setGreeting("Hello " + request.getName() + " from Protobuf!")
                        .build();
                ctx.contentType("application/octet-stream").result(response.toByteArray());
            } catch (InvalidProtocolBufferException e) {
                ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
            }
        });
    }
}
