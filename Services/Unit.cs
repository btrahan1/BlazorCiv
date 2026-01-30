using System;

namespace BlazorCiv.Services
{
    public enum UnitType
    {
        Warrior,
        Settler,
        Archer,
        Barbarian
    }

    public class Unit
    {
        public int Id { get; set; }
        public UnitType Type { get; set; }
        
        // Position
        public int Q { get; set; }
        public int R { get; set; }

        public string Owner { get; set; } = "Player"; // "Player", "Enemy", "Barbarian"
        public int MovementPoints { get; set; } = 2;

        // Combat Stats
        public int Health { get; set; } = 10;
        public int MaxHealth { get; set; } = 10;
        public int AttackPower { get; set; } = 4;
    }
}
