from typing import Dict, Tuple
from app.db.models.project import RoomType, RenovationScope


class CostEstimator:
    """Estimates renovation costs based on location, room type, and scope."""
    
    # Base rates per square foot (national average, 2024)
    BASE_RATES = {
        RoomType.KITCHEN: {
            RenovationScope.COSMETIC: (50, 100),
            RenovationScope.MODERATE: (150, 250),
            RenovationScope.FULL: (300, 500),
            RenovationScope.LUXURY: (600, 1200),
        },
        RoomType.BATHROOM: {
            RenovationScope.COSMETIC: (75, 125),
            RenovationScope.MODERATE: (200, 350),
            RenovationScope.FULL: (400, 600),
            RenovationScope.LUXURY: (800, 1500),
        },
        RoomType.BEDROOM: {
            RenovationScope.COSMETIC: (30, 60),
            RenovationScope.MODERATE: (75, 150),
            RenovationScope.FULL: (150, 300),
            RenovationScope.LUXURY: (400, 800),
        },
        RoomType.LIVING_ROOM: {
            RenovationScope.COSMETIC: (40, 80),
            RenovationScope.MODERATE: (100, 200),
            RenovationScope.FULL: (200, 400),
            RenovationScope.LUXURY: (500, 1000),
        },
        RoomType.DINING_ROOM: {
            RenovationScope.COSMETIC: (35, 70),
            RenovationScope.MODERATE: (90, 180),
            RenovationScope.FULL: (180, 350),
            RenovationScope.LUXURY: (450, 900),
        },
        RoomType.BASEMENT: {
            RenovationScope.COSMETIC: (40, 90),
            RenovationScope.MODERATE: (100, 200),
            RenovationScope.FULL: (200, 450),
            RenovationScope.LUXURY: (500, 1100),
        },
        RoomType.OTHER: {
            RenovationScope.COSMETIC: (40, 80),
            RenovationScope.MODERATE: (100, 200),
            RenovationScope.FULL: (200, 400),
            RenovationScope.LUXURY: (500, 1000),
        },
    }
    
    # Location multipliers (state-based)
    LOCATION_MULTIPLIERS = {
        # High cost areas
        "CA": 1.35,  # California
        "NY": 1.30,  # New York
        "HI": 1.40,  # Hawaii
        "MA": 1.25,  # Massachusetts
        "CT": 1.25,  # Connecticut
        "NJ": 1.25,  # New Jersey
        "WA": 1.20,  # Washington
        "CO": 1.15,  # Colorado
        "OR": 1.15,  # Oregon
        "MD": 1.15,  # Maryland
        
        # Medium cost areas
        "IL": 1.10,  # Illinois
        "FL": 1.05,  # Florida
        "TX": 1.00,  # Texas
        "AZ": 1.00,  # Arizona
        "NC": 0.95,  # North Carolina
        "GA": 0.95,  # Georgia
        "VA": 1.05,  # Virginia
        "PA": 1.00,  # Pennsylvania
        
        # Lower cost areas
        "OH": 0.90,  # Ohio
        "MI": 0.90,  # Michigan
        "IN": 0.85,  # Indiana
        "TN": 0.85,  # Tennessee
        "MO": 0.85,  # Missouri
        "AL": 0.80,  # Alabama
        "MS": 0.75,  # Mississippi
        "AR": 0.80,  # Arkansas
        "KY": 0.85,  # Kentucky
        "WV": 0.80,  # West Virginia
        
        # Default for unlisted states
        "DEFAULT": 1.00,
    }
    
    # City-specific adjustments (on top of state multiplier)
    CITY_MULTIPLIERS = {
        # Major metros
        "San Francisco": 1.25,
        "New York": 1.20,
        "Los Angeles": 1.15,
        "Seattle": 1.15,
        "Boston": 1.15,
        "Washington": 1.10,
        "San Diego": 1.10,
        "Denver": 1.10,
        "Portland": 1.10,
        "Miami": 1.10,
        "Chicago": 1.05,
        "Austin": 1.05,
        
        # Mid-size cities
        "Phoenix": 1.00,
        "Dallas": 1.00,
        "Houston": 0.95,
        "Atlanta": 0.95,
        "Charlotte": 0.95,
        "Nashville": 0.95,
        
        # Default
        "DEFAULT": 1.00,
    }
    
    def estimate_cost(
        self,
        room_type: RoomType,
        scope: RenovationScope,
        square_footage: float,
        state: str = None,
        city: str = None,
    ) -> Dict[str, float]:
        """
        Calculate renovation cost estimate with location adjustments.
        
        Returns:
            Dict with cost_low, cost_high, location_multiplier, breakdown
        """
        
        # Get base rates
        base_low, base_high = self.BASE_RATES.get(room_type, {}).get(
            scope, (100, 200)
        )
        
        # Apply location multipliers
        location_multiplier = 1.0
        
        if state:
            state_multiplier = self.LOCATION_MULTIPLIERS.get(
                state.upper(), self.LOCATION_MULTIPLIERS["DEFAULT"]
            )
            location_multiplier *= state_multiplier
        
        if city:
            city_multiplier = self.CITY_MULTIPLIERS.get(
                city.title(), self.CITY_MULTIPLIERS["DEFAULT"]
            )
            location_multiplier *= city_multiplier
        
        # Calculate total costs
        adjusted_low = base_low * location_multiplier
        adjusted_high = base_high * location_multiplier
        
        total_low = adjusted_low * square_footage
        total_high = adjusted_high * square_footage
        
        # Breakdown (typical distribution)
        materials_pct = 0.45
        labor_pct = 0.40
        permits_pct = 0.05
        contingency_pct = 0.10
        
        breakdown = {
            "materials_low": total_low * materials_pct,
            "materials_high": total_high * materials_pct,
            "labor_low": total_low * labor_pct,
            "labor_high": total_high * labor_pct,
            "permits_low": total_low * permits_pct,
            "permits_high": total_high * permits_pct,
            "contingency_low": total_low * contingency_pct,
            "contingency_high": total_high * contingency_pct,
        }
        
        return {
            "cost_low": round(total_low, 2),
            "cost_high": round(total_high, 2),
            "location_multiplier": round(location_multiplier, 2),
            "breakdown": breakdown,
            "per_sqft_low": round(adjusted_low, 2),
            "per_sqft_high": round(adjusted_high, 2),
        }
    
    def get_timeline_estimate(
        self,
        scope: RenovationScope,
        room_type: RoomType,
    ) -> str:
        """Get estimated timeline for renovation."""
        
        timelines = {
            RenovationScope.COSMETIC: {
                "duration": "1-2 weeks",
                "phases": [
                    ("Planning & Prep", "1-2 days"),
                    ("Painting/Updates", "3-5 days"),
                    ("Finishing", "2-3 days"),
                ]
            },
            RenovationScope.MODERATE: {
                "duration": "3-6 weeks",
                "phases": [
                    ("Planning & Permits", "1 week"),
                    ("Demolition", "2-3 days"),
                    ("Installation", "2-3 weeks"),
                    ("Finishing", "1 week"),
                ]
            },
            RenovationScope.FULL: {
                "duration": "2-4 months",
                "phases": [
                    ("Planning & Permits", "2-3 weeks"),
                    ("Demolition", "1 week"),
                    ("Rough Installation", "3-4 weeks"),
                    ("Fine Installation", "2-3 weeks"),
                    ("Finishing", "2 weeks"),
                ]
            },
            RenovationScope.LUXURY: {
                "duration": "4-6 months",
                "phases": [
                    ("Planning & Design", "4-6 weeks"),
                    ("Permits", "2-4 weeks"),
                    ("Demolition", "1-2 weeks"),
                    ("Custom Work", "8-12 weeks"),
                    ("Installation", "4-6 weeks"),
                    ("Finishing", "2-3 weeks"),
                ]
            }
        }
        
        info = timelines.get(scope, timelines[RenovationScope.MODERATE])
        
        result = f"**Estimated Timeline:** {info['duration']}\n\n"
        result += "**Phases:**\n"
        for phase, duration in info['phases']:
            result += f"- {phase}: {duration}\n"
        
        # Add room-specific notes
        if room_type == RoomType.KITCHEN:
            result += "\n*Note: Kitchen projects may require temporary alternative cooking arrangements.*"
        elif room_type == RoomType.BATHROOM:
            result += "\n*Note: You may need to use an alternative bathroom during renovation.*"
        
        return result


# Singleton instance
cost_estimator = CostEstimator()
