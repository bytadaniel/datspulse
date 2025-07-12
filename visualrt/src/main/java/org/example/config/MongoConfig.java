package org.example.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MongoConfig {
    @Value("${mongodb.host}")
    private String host;

    @Value("${mongodb.port}")
    private int port;

    @Value("${mongodb.username}")
    private String username;

    @Value("${mongodb.password}")
    private String password;

    @Value("${mongodb.dbname}")
    private String dbName;

    @Bean
    public MongoClient mongoClient() {
        String connectionString = String.format("mongodb://%s:%s@%s:%d",
                username, password, host, port);
        return MongoClients.create(connectionString);
    }
}
