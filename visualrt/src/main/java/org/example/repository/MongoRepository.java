package org.example.repository;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class MongoRepository {
    private final MongoCollection<Document> collection;

    @Autowired
    public MongoRepository(
            MongoClient mongoClient,
            @Value("${mongodb.dbname}") String dbName,
            @Value("${mongodb.collection}") String collectionName
    ) {
        MongoDatabase db = mongoClient.getDatabase(dbName);
        this.collection = db.getCollection(collectionName);
    }

    public Document findFirstDocument() {
        return collection.find().first();
    }

    public void printFirstDocument() {
        Document doc = findFirstDocument();
        if (doc != null) {
            log.info("First document from MongoDB:\n{}", doc.toJson());
        } else {
            log.info("Collection is empty");
        }
    }
}
