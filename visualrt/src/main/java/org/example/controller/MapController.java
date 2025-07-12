package org.example.controller;

import org.example.data.ArenaResponse;
import org.example.data.HexCell;
import org.example.service.MapVisualisationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
public class MapController {
    private final MapVisualisationService mapVisualisationService;

    @Autowired
    public MapController(MapVisualisationService mapVisualisationService) {
        this.mapVisualisationService = mapVisualisationService;
    }

    @GetMapping("/visual")
    public String visualizeMap(Model model) throws Exception {
        try {
            //ArenaResponse response = mapVisualisationService.getCurrentState();
            ArenaResponse response = mapVisualisationService.loadArenaResponse();
            Map<HexCell, String> cellStyles = mapVisualisationService.calculateCellStyles(response);
            model.addAllAttributes(Map.of(
                    "map", response.map,
                    "ants", response.ants,
                    "food", response.food,
                    "home", response.home,
                    "turnNo", response.turnNo,
                    "score", response.score,
                    "cellStyles", cellStyles,
                    "currentIndex", mapVisualisationService.getCurrentIndex(),
                    "totalDocuments", mapVisualisationService.getCachedDocuments().size()
            ));
            return "map";
        } catch (Exception ex) {
            model.addAttribute("error", "Failed to visualize map" + ex.getMessage());
            return "error";
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Current index: " + mapVisualisationService.getCurrentIndex();
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
