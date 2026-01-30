using System;
using System.Collections.Generic;

namespace BlazorCiv.Services
{
    public class WorldState
    {
        public Dictionary<(int, int), HexTile> Tiles { get; private set; } = new Dictionary<(int, int), HexTile>();
        public List<Unit> Units { get; private set; } = new List<Unit>();
        public List<City> Cities { get; private set; } = new List<City>();
        public int MapRadius { get; private set; } = 10;

        // Logic
        public Unit? SelectedUnit { get; private set; }

        public void FoundCity()
        {
            if (SelectedUnit == null || SelectedUnit.Type != UnitType.Settler) return;

            // Check if city already exists here
            if (Cities.Any(c => c.Q == SelectedUnit.Q && c.R == SelectedUnit.R)) return;

            // Create City
            var city = new City 
            { 
                Id = Cities.Count + 1, 
                Name = "City " + (Cities.Count + 1),
                Q = SelectedUnit.Q,
                R = SelectedUnit.R
            };
            Cities.Add(city);

            // City always has a road
            if (Tiles.TryGetValue((city.Q, city.R), out var tile))
            {
                tile.HasRoad = true;
            }

            // Consume Unit
            Units.Remove(SelectedUnit);
            SelectedUnit = null;
        }
        
        public void GenerateMap(int radius)
        {
            MapRadius = radius;
            Tiles.Clear();
            Units.Clear();
            var random = new Random();

            // 1. Generate Terrain
            for (int q = -radius; q <= radius; q++)
            {
                int r1 = Math.Max(-radius, -q - radius);
                int r2 = Math.Min(radius, -q + radius);

                for (int r = r1; r <= r2; r++)
                {
                    // Procedural Logic (Simulated)
                    double dist = Math.Sqrt(q * q + r * r);
                    double noise = random.NextDouble();
                    
                    var tile = new HexTile { Q = q, R = r };

                    if (dist > radius * 0.8) 
                    {
                        tile.Terrain = TerrainType.Ocean;
                        tile.Height = 1; 
                    }
                    else if (noise > 0.85)
                    {
                        tile.Terrain = TerrainType.Mountain;
                        tile.Height = 3; // Lowered from 5 to match asset
                    }
                    else if (noise > 0.70)
                    {
                        tile.Terrain = TerrainType.Hill;
                        tile.Height = 2;
                    }
                    else
                    {
                        tile.Terrain = TerrainType.Grass;
                        tile.Height = 1;
                    }

                    // Resources
                    if (tile.Terrain == TerrainType.Grass && random.NextDouble() < 0.10)
                    {
                        tile.Resource = ResourceType.Wheat;
                    }
                    else if (tile.Terrain == TerrainType.Hill && random.NextDouble() < 0.15)
                    {
                        tile.Resource = ResourceType.Iron;
                    }

                    Tiles[(q, r)] = tile;
                }
            }

            // 2. Spawn Starting Unit (Find a non-water tile near center)
            // Initial Units
            Units.Add(new Unit { Id = 1, Type = UnitType.Settler, Q = 0, R = 0, Owner = "Player" });
            Units.Add(new Unit { Id = 2, Type = UnitType.Warrior, Q = 1, R = -1, Owner = "Player" });

            // Spawn random Barbarian
            SpawnBarbarian();
        }

        private void SpawnBarbarian()
        {
            var rand = new Random();
            // Filter Valid Tiles FIRST (Not Water, Not Mountain, Far from Center)
            var validTiles = Tiles.Values.Where(t => 
                t.Terrain != TerrainType.Ocean && 
                t.Terrain != TerrainType.Mountain &&
                (Math.Abs(t.Q) > 3 || Math.Abs(t.R) > 3)
            ).ToList();

            if (validTiles.Any())
            {
                var t = validTiles[rand.Next(validTiles.Count)];
                
                // Create Camp
                t.HasBarbarianCamp = true;

                // Spawn Fortified Warrior
                Units.Add(new Unit { 
                    Id = 99, 
                    Type = UnitType.Barbarian, 
                    Q = t.Q, 
                    R = t.R, 
                    Owner = "Barbarian",
                    Health = 10,
                    MaxHealth = 10,
                    AttackPower = 5,
                    DefensePower = 5 
                });
            }
        }
        
        public int Turn { get; private set; } = 1;
        public int Gold { get; private set; } = 0;
        public int Science { get; private set; } = 0;
        
        // Techs
        public List<TechType> UnlockedTechs { get; private set; } = new List<TechType> { TechType.None };
        public TechType CurrentResearch { get; set; } = TechType.None;
        public int ResearchProgress { get; set; } = 0;

        public bool CanResearch(TechType t)
        {
            if (UnlockedTechs.Contains(t)) return false; // Already researched
            
            // Dependencies
            switch (t)
            {
                case TechType.BronzeWorking: return UnlockedTechs.Contains(TechType.Mining);
                case TechType.IronWorking: return UnlockedTechs.Contains(TechType.BronzeWorking);
                case TechType.Writing: return UnlockedTechs.Contains(TechType.Pottery);
                case TechType.TheWheel: return UnlockedTechs.Contains(TechType.Mining);
                // Tier 1 (No reqs)
                case TechType.Mining:
                case TechType.Pottery:
                case TechType.Archery:
                    return true;
                default: 
                    return false;
            }
        }

        public void UnlockTech(TechType t)
        {
            if (!UnlockedTechs.Contains(t)) UnlockedTechs.Add(t);
        }

        public bool CanBuildUnit(UnitType type)
        {
            if (type == UnitType.Archer) return UnlockedTechs.Contains(TechType.Archery);
            if (type == UnitType.Chariot) return UnlockedTechs.Contains(TechType.TheWheel);
            if (type == UnitType.Chariot) return UnlockedTechs.Contains(TechType.TheWheel);
            if (type == UnitType.Swordsman) return UnlockedTechs.Contains(TechType.IronWorking);
            // Worker defaults to true or requires pottery/mining? Let's say Mining for now to clean forests later?
            // Actually let's just allow it default.
            return true; // Settler/Warrior/Worker always unlocked
        }
        
        public bool CanBuildBuilding(BuildingType type)
        {
             if (type == BuildingType.Granary) return UnlockedTechs.Contains(TechType.Pottery);
             if (type == BuildingType.Monument) return UnlockedTechs.Contains(TechType.Writing);
             if (type == BuildingType.Barracks) return UnlockedTechs.Contains(TechType.BronzeWorking);
             return true; 
        }

        public int GetUnitCost(UnitType type)
        {
            if (type == UnitType.Settler) return 20;
            if (type == UnitType.Archer) return 15;
            if (type == UnitType.Chariot) return 20;
            if (type == UnitType.Chariot) return 20;
            if (type == UnitType.Swordsman) return 25;
            if (type == UnitType.Worker) return 15;
            return 10; // Warrior
        }

        public void BuyUnit(City c, UnitType type)
        {
            int cost = GetUnitCost(type) * 4; // 4x Gold Cost
            if (Gold >= cost)
            {
                Gold -= cost;
                var newUnit = new Unit 
                { 
                    Id = Units.Count > 0 ? Units.Max(u => u.Id) + 1 : 1, 
                    Type = type, 
                    Q = c.Q, 
                    R = c.R,
                    Owner = "Player",
                    MovementPoints = 0 // Can't move immediately
                };
                Units.Add(newUnit);
            }
        }


        public City? SelectedCity { get; private set; }
        public Unit? LatestEnemy { get; private set; } // For UI
        public (int q, int r)? SelectedTileCoords { get; private set; }

        public void SelectTile(int q, int r)
        {
            SelectedTileCoords = (q, r);

            // Clear enemy info on new selection
            if (Units.FirstOrDefault(u => u.Q == q && u.R == r) != SelectedUnit)
            {
               // Only clear if we aren't "re-selecting" the sticky unit
            }
            // Actually, simpler: Always clear unless we set it in combat
            // But we need it to persist for the "Sticky" case.
            // Let's clear it if we explicitly select something else.
            
            // 0. Combat/Move Override
            if (SelectedUnit != null && SelectedUnit.Owner == "Player")
            {
                if (MoveSelectedUnit(q, r)) return;
            }

            // 1. Try Select Unit (Top Priority)
            var unit = Units.FirstOrDefault(u => u.Q == q && u.R == r);
            if (unit != null)
            {
                SelectedUnit = unit;
                LatestEnemy = null; // New selection clears enemy focus
                SelectedCity = null;
                return;
            }

            // 2. Try Select City
            var city = Cities.FirstOrDefault(c => c.Q == q && c.R == r);
            if (city != null)
            {
                SelectedCity = city;
                SelectedUnit = null;
                LatestEnemy = null;
                return;
            }

            // 3. Select Empty Tile (Deselect all)
            SelectedUnit = null;
            SelectedCity = null;
            LatestEnemy = null;
        }

        public void SelectUnitAt(int q, int r)
        {
            SelectedUnit = Units.FirstOrDefault(u => u.Q == q && u.R == r);
        }

        public bool IsTileHasRoad(int q, int r)
        {
            if (Tiles.TryGetValue((q, r), out var t)) return t.HasRoad;
            return false;
        }

        public bool MoveSelectedUnit(int targetQ, int targetR)
        {
            if (SelectedUnit == null || SelectedUnit.MovementPoints <= 0) return false;

            // Basic Validation (Distance 1)
            int dist = (Math.Abs(SelectedUnit.Q - targetQ) + Math.Abs(SelectedUnit.Q + SelectedUnit.R - targetQ - targetR) + Math.Abs(SelectedUnit.R - targetR)) / 2;
            
            // Check for occupants
            var enemyUnit = Units.FirstOrDefault(u => u.Q == targetQ && u.R == targetR && u.Owner != SelectedUnit.Owner);
            var friendlyUnit = Units.FirstOrDefault(u => u.Q == targetQ && u.R == targetR && u.Owner == SelectedUnit.Owner);
            var city = Cities.FirstOrDefault(c => c.Q == targetQ && c.R == targetR);

            // 1. Prioritize Combat (Attack if enemy nearby)
            if (dist == 1 && enemyUnit != null)
            {
                ResolveCombat(SelectedUnit, enemyUnit);
                SelectedUnit.MovementPoints = 0; // Attack consumes turn
                return true;
            }

            // 2. Movement Logic
            if (dist == 1 && Tiles.ContainsKey((targetQ, targetR)) && friendlyUnit == null && city == null)
            {
                // MOVE COST
                double cost = 1.0;
                
                // Road Logic
                bool sourceHasRoad = false;
                bool targetHasRoad = false;

                if (Tiles.TryGetValue((SelectedUnit.Q, SelectedUnit.R), out var srcTile)) sourceHasRoad = srcTile.HasRoad;
                if (Tiles.TryGetValue((targetQ, targetR), out var destTile)) targetHasRoad = destTile.HasRoad;

                if (sourceHasRoad && targetHasRoad) cost = 0.5;

                SelectedUnit.Q = targetQ;
                SelectedUnit.R = targetR;
                SelectedUnit.MovementPoints -= cost;
                if (SelectedUnit.MovementPoints < 0) SelectedUnit.MovementPoints = 0;

                // CLEAR CAMP REWARD
                if (Tiles.TryGetValue((targetQ, targetR), out var tile) && tile.HasBarbarianCamp)
                {
                    tile.HasBarbarianCamp = false; // Destroy Camp
                    // TODO: Give Gold
                }

                return true;
            }
            return false;
        }

        private void ResolveCombat(Unit attacker, Unit defender)
        {
            LatestEnemy = defender; // Track for UI

            // Simple RNG Combat
            var rand = new Random();
            int attackerRoll = rand.Next(1, 10) + attacker.AttackPower; // d10 + Attack
            int defenderRoll = rand.Next(1, 10) + defender.DefensePower; // d10 + Defense

            // Barbarians might be weaker?
            if (defender.Type == UnitType.Barbarian) defenderRoll -= 1; 

            if (attackerRoll >= defenderRoll)
            {
                // Hit!
                defender.Health -= 4;
                if (defender.Health <= 0)
                {
                    Units.Remove(defender);
                    // Move Attacker into tile (Civ style)
                    attacker.Q = defender.Q;
                    attacker.R = defender.R;
                    
                    // Check Camp destruction logic again if happened
                    if (Tiles.TryGetValue((attacker.Q, attacker.R), out var tile) && tile.HasBarbarianCamp)
                    {
                        tile.HasBarbarianCamp = false; 
                    }
                }
            }
            else
            {
                // Counter-Hit!
                attacker.Health -= 3;
                if (attacker.Health <= 0)
                {
                    Units.Remove(attacker);
                    SelectedUnit = null;
                }
            }
        }

        public void BuildRoad()
        {
            if (SelectedUnit == null || SelectedUnit.Type != UnitType.Worker) return;
            if (SelectedUnit.MovementPoints <= 0) return;

            if (Tiles.TryGetValue((SelectedUnit.Q, SelectedUnit.R), out var tile))
            {
                tile.HasRoad = true;
                SelectedUnit.MovementPoints = 0; // Consumes turn
            }
        }


        public void EndTurn()
        {
            Turn++;

            // 1. Reset Units
            foreach(var u in Units)
            {
                u.MovementPoints = 2; // Default restore
            }

            // 2. Process Cities
            foreach(var c in Cities)
            {
                // Calculate Yields
                var yields = GetCityYields(c);

                // Growth
                c.FoodStored += yields.food;
                if (c.FoodStored >= 10 * c.Population)
                {
                    c.FoodStored = 0;
                    c.Population++;
                }

                // Production
                c.ProductionStored += yields.prod;
                
                // Gold
                Gold += yields.gold;
                
                // Science (Global)
                Science += yields.science;
                ResearchProgress += yields.science;

                // Check Research Complete (Simplified: 50 science per tech)
                if (CurrentResearch != TechType.None && ResearchProgress >= 50)
                {
                    UnlockTech(CurrentResearch);
                    CurrentResearch = TechType.None;
                    ResearchProgress = 0;
                    // TODO: Notify UI
                }

                // 1. UNIT PRODUCTION
                if (c.ProducingUnit.HasValue)
                {
                    if (!CanBuildUnit(c.ProducingUnit.Value))
                    {
                        c.ProducingUnit = null; // Cancel invalid
                        continue;
                    }

                    int cost = 10; // Default (Warrior)
                    if (c.ProducingUnit == UnitType.Settler) cost = 20;
                    if (c.ProducingUnit == UnitType.Archer) cost = 15;
                    if (c.ProducingUnit == UnitType.Chariot) cost = 20;
                    if (c.ProducingUnit == UnitType.Swordsman) cost = 25;

                    if (c.ProductionStored >= cost)
                    {
                        c.ProductionStored -= cost;
                        var newUnit = new Unit 
                        { 
                            Id = Units.Count > 0 ? Units.Max(u => u.Id) + 1 : 1, 
                            Type = c.ProducingUnit.Value, 
                            Q = c.Q, 
                            R = c.R 
                        };
                        
                        // Set Stats Based on Type
                        switch (newUnit.Type)
                        {
                            case UnitType.Warrior: newUnit.Health = 12; newUnit.MaxHealth = 12; newUnit.AttackPower = 6; newUnit.DefensePower = 8; break;
                            case UnitType.Archer: newUnit.Health = 8; newUnit.MaxHealth = 8; newUnit.AttackPower = 8; newUnit.DefensePower = 4; break;
                            case UnitType.Settler: newUnit.Health = 5; newUnit.MaxHealth = 5; newUnit.AttackPower = 0; newUnit.DefensePower = 1; break;
                            case UnitType.Chariot: newUnit.Health = 10; newUnit.MaxHealth = 10; newUnit.AttackPower = 10; newUnit.DefensePower = 5; break;
                            case UnitType.Swordsman: newUnit.Health = 15; newUnit.MaxHealth = 15; newUnit.AttackPower = 10; newUnit.DefensePower = 10; break;
                        }

                        Units.Add(newUnit);
                        c.ProducingUnit = null; // Reset
                    }
                }
                // 2. BUILDING PRODUCTION
                else if (c.ProducingBuilding.HasValue)
                {
                    if (!CanBuildBuilding(c.ProducingBuilding.Value))
                    {
                        c.ProducingBuilding = null;
                        continue;
                    }

                    int cost = 0;
                    if (c.ProducingBuilding == BuildingType.Granary) cost = 12;
                    if (c.ProducingBuilding == BuildingType.Barracks) cost = 15;
                    if (c.ProducingBuilding == BuildingType.Monument) cost = 8;

                    if (c.ProductionStored >= cost)
                    {
                        c.ProductionStored -= cost;
                        // Apply Building
                        if (c.ProducingBuilding == BuildingType.Granary) c.HasGranary = true;
                        if (c.ProducingBuilding == BuildingType.Barracks) c.HasBarracks = true;
                        if (c.ProducingBuilding == BuildingType.Monument) c.HasMonument = true;
                        
                        c.ProducingBuilding = null; // Reset
                    }
                }
            }
        }

        // Helper for Rendering Map
        public object[] GetRenderData()
        {
            var list = new List<object>();
            foreach(var t in Tiles.Values)
            {
                list.Add(new { 
                    q = t.Q, 
                    r = t.R, 
                    type = t.Terrain.ToString(), 
                    height = t.Height,
                    hasCamp = t.HasBarbarianCamp,
                    hasRoad = t.HasRoad,
                    resource = t.Resource.ToString()
                });
            }
            return list.ToArray();
        }

        // Helper for Rendering Units
        public object[] GetUnitData()
        {
            return Units.Select(u => {
                int h = 1;
                if (Tiles.TryGetValue((u.Q, u.R), out var tile)) h = tile.Height;
                return new { id = u.Id, type = u.Type.ToString(), q = u.Q, r = u.R, owner = u.Owner, height = h };
            }).ToArray();
        }

        public object[] GetCityData()
        {
            return Cities.Select(c => {
                 int h = 1;
                 if (Tiles.TryGetValue((c.Q, c.R), out var tile)) h = tile.Height;
                 return new { 
                     id = c.Id, 
                     name = c.Name, 
                     q = c.Q, 
                     r = c.R, 
                     pop = c.Population, 
                     height = h,
                     hasGranary = c.HasGranary,
                     hasBarracks = c.HasBarracks,
                     hasMonument = c.HasMonument
                 };
            }).ToArray();
        }

        public (int food, int prod, int gold, int science) GetCityYields(City c)
        {
            int food = 2; // City Center Base
            int prod = 1;
            int gold = 2; // City Center Base Gold
            int science = 1; // Base Science

            // Population Bonus
            science += c.Population / 2;

            // Add Center Tile Yields (User Request: Building on resources gives them)
            if (Tiles.TryGetValue((c.Q, c.R), out var centerTile))
            {
                var centerYield = GetTileYield(centerTile);
                food += centerYield.food;
                prod += centerYield.prod;
                gold += centerYield.gold;
            }

            // Building Bonuses
            if (c.HasGranary) food += 2;
            if (c.HasBarracks) prod += 1; // Training supplies?
            if (c.HasMonument) prod += 1; // Cultural inspiration?
            if (c.HasMonument) science += 1; // Monument gives science too? Why not.

            // Directions for neighbors in Axial
            var directions = new (int q, int r)[] {
                (1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)
            };

            foreach (var d in directions)
            {
                var nQ = c.Q + d.q;
                var nR = c.R + d.r;

                if (Tiles.TryGetValue((nQ, nR), out var tile))
                {
                    var y = GetTileYield(tile);
                    food += y.food;
                    prod += y.prod;
                    gold += y.gold;
                    // Science from terrain? Maybe later.
                }
            }
            return (food, prod, gold, science);
        }

        private (int food, int prod, int gold) GetTileYield(HexTile t)
        {
            int f = 0;
            int p = 0;
            int g = 0;

            // Terrain Base
            switch (t.Terrain)
            {
                case TerrainType.Grass: f = 1; break;
                case TerrainType.Ocean: g = 1; f = 1; break; 
                case TerrainType.Coast: g = 1; f = 1; break;
                case TerrainType.Hill: p = 1; break;
                // Mountain/Snow = 0
            }

            // Resources
            if (t.Resource == ResourceType.Wheat) f += 1;
            if (t.Resource == ResourceType.Iron) p += 1;

            return (f, p, g);
        }
    }

    public enum TechType
    {
        None,
        Pottery,
        Mining,
        Archery,
        Writing,
        BronzeWorking,
        TheWheel,
        IronWorking
    }
}
