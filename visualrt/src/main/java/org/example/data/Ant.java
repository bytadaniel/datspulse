package org.example.data;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Ant {
    public int q;
    public int r;
    public int type;
    public int health;
    public String id;
}
