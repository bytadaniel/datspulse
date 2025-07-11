import json
import matplotlib.pyplot as plt
from matplotlib.patches import RegularPolygon
import numpy as np

# Загрузка данных из JSON-файла
INPUT_FILE = 'arena_response.json'

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Извлечение карты
map_data = data.get('map', [])

# Параметры шестиугольника
hex_size = 1
x_offset = hex_size * 3 / 2
y_offset = hex_size * np.sqrt(3) / 2

# Цвета для разных типов тайлов
tile_colors = {
    1: '#f7fbff',  # ant spot
    2: '#d9f0a3',  # plain
    3: '#fee597',  # dirt
    4: '#fdae61',  # acid
    5: '#e6550d',  # rock
}

# Создание графика
fig, ax = plt.subplots(figsize=(10, 10))

# Отрисовка каждого тайла
for tile in map_data:
    q = tile['q']
    r = tile['r']
    tile_type = tile['type']

    x = q * x_offset + (r % 2) * hex_size / 2
    y = r * y_offset

    color = tile_colors.get(tile_type, 'lightgray')

    hexagon = RegularPolygon(
        (x, y),
        numVertices=6,
        radius=hex_size,
        orientation=np.radians(30),
        facecolor=color,
        edgecolor='black',
        linewidth=1
    )
    ax.add_patch(hexagon)

    # Подпись с координатами
    ax.text(x, y, f"({q},{r})", ha='center', va='center', fontsize=8)

# Настройки графика
ax.set_aspect('equal')
ax.axis('off')
plt.tight_layout()
plt.title("Hex Map Visualization")
plt.show()