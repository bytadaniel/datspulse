package org.example.data;

import lombok.Data;

import java.util.List;

@Data
public class ArenaResponse {
    public List<HexCell> map;
    public List<Ant> ants;
    public List<Food> food;
    public List<Home> home;
    public int turnNo;
    public int score;
}
