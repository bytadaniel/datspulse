package org.example.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.example.data.ArenaResponse;
import org.example.data.HexCell;
import org.example.repository.MongoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@Getter
public class MapVisualisationService {
    private final ObjectMapper objectMapper;
    private final MongoRepository mongoRepository;
    private final List<Document> cachedDocuments;
    private int currentIndex = 0;

    @Autowired
    public MapVisualisationService(MongoRepository mongoRepository) {
        this.mongoRepository = mongoRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.cachedDocuments = Collections.emptyList();//Collections.unmodifiableList(mongoRepository.findAllByInsertOrder());
        //initAutoRotation();
    }

    private void initAutoRotation() {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            if (!cachedDocuments.isEmpty()) {
                currentIndex = (currentIndex + 1) % cachedDocuments.size();
            } else {
                log.error("no documents in mongo");
            }
        }, 2, 2, TimeUnit.SECONDS);
    }

    public ArenaResponse getCurrentState() {
        Document currentDoc = cachedDocuments.get(currentIndex);
        return convertToArenaResponse(currentDoc.get("state", Document.class));
    }

    public ArenaResponse loadArenaResponse() throws IOException {
        Document doc = mongoRepository.findFirstDocument();
        log.info(doc.toJson());
        return convertToArenaResponse(doc.get("state", Document.class));
        //return objectMapper.readValue(new File("/home/mixalight/IdeaProjects/HakatonHex/arena_response.json"), ArenaResponse.class);
    }

    private ArenaResponse convertToArenaResponse(Document doc) {
        try {
            String json = doc.toJson();
            return objectMapper.readValue(json, ArenaResponse.class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to convert MongoDB document to ArenaResponse", e);
        }
    }

    public Map<HexCell, String> calculateCellStyles(ArenaResponse response) {
        int minQ = response.map.stream().mapToInt(c -> c.q).min().orElse(0);
        int minR = response.map.stream().mapToInt(c -> c.r).min().orElse(0);

        Map<HexCell, String> cellStyles = new HashMap<>();
        for (HexCell cell : response.map) {
            cellStyles.put(cell, calculateCellStyle(cell, minQ, minR));
        }
        return cellStyles;
    }

    private String calculateCellStyle(HexCell cell, int minQ, int minR) {
        double size = 40.0;
        double width = Math.sqrt(3) * size;
        double height = size * 1.5;

        int normQ = cell.q - minQ;
        int normR = cell.r - minR;

        double x = normQ * width + (normR % 2) * width / 2;
        double y = normR * height;

        return String.format(
                "left: %.1fpx; top: %.1fpx; width: %.1fpx; height: %.1fpx;",
                x, y, width, height * 4 / 3
        );
    }


}
