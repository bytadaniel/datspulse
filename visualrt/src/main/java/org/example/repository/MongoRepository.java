package org.example.repository;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Sorts;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Repository
public class MongoRepository {
    private final MongoCollection<Document> collection;
    private List<Document> cachedDocuments = Collections.emptyList();

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

    public List<Document> findAllByInsertOrder() {
        log.info("Docs readed from collection");
        return collection.find()
                .sort(Sorts.ascending("_id"))
                .into(new ArrayList<>());
    }
}
