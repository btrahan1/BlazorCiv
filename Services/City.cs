using System;

namespace BlazorCiv.Services
{
    public class City
    {
        public int Id { get; set; }
        public string Name { get; set; } = "Capital";
        public string Owner { get; set; } = "Player";
        
        // Location
        public int Q { get; set; }
        public int R { get; set; }

        // Core Stats
        public int Population { get; set; } = 1;
        public int FoodStored { get; set; } = 0;
        public int ProductionStored { get; set; } = 0;
        
        // Buildings (State)
        public bool HasGranary { get; set; }
        public bool HasBarracks { get; set; }
        public bool HasMonument { get; set; }

        // Production Queue
        public UnitType? ProducingUnit { get; set; }
        public BuildingType? ProducingBuilding { get; set; }
    }

    public enum BuildingType
    {
        Granary, // +2 Food
        Barracks, // Unlock Archer? Or XP?
        Monument // +2 Culture (Border growth, simulated)
    }
}
