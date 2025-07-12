package org.example.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.data.ArenaResponse;
import org.example.data.HexCell;
import org.example.repository.MongoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class MapVisualisationService {
    private final ObjectMapper objectMapper;
    private final MongoRepository mongoRepository;

    @Autowired
    public MapVisualisationService(MongoRepository mongoRepository) {
        this.mongoRepository = mongoRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public ArenaResponse loadArenaResponse() throws IOException {
        mongoRepository.printFirstDocument();
        return objectMapper.readValue(new File("/home/mixalight/IdeaProjects/HakatonHex/arena_response.json"), ArenaResponse.class);
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
