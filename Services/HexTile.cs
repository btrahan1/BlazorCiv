using System;

namespace BlazorCiv.Services
{
    public enum TerrainType
    {
        Ocean,
        Coast,
        Grass,
        Plains,
        Desktop, // Fun easter egg maybe?
        Hill,
        Mountain,
        Snow
    }

    public class HexTile
    {
        // Axial Coordinates
        public int Q { get; set; }
        public int R { get; set; }

        // Data
        public TerrainType Terrain { get; set; }
        public int Height { get; set; }
        
        // Gameplay
        public bool IsExplored { get; set; } = true; // Visible for now
        public bool HasRoad { get; set; }
        public bool HasBarbarianCamp { get; set; }
        public ResourceType Resource { get; set; }
    }

    public enum ResourceType
    {
        None,
        Wheat,
        Iron
    }
}
