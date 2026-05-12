package com.antigravity;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class DbInspector {
    public static void main(String[] args) {
        try (MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017")) {
            for (String dbName : mongoClient.listDatabaseNames()) {
                System.out.println("Database: " + dbName);
                MongoDatabase db = mongoClient.getDatabase(dbName);
                for (String colName : db.listCollectionNames()) {
                    long count = db.getCollection(colName).countDocuments();
                    System.out.println("  Collection: " + colName + " (Count: " + count + ")");
                }
            }
        }
    }
}
