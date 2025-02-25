export const getMoistureStatus = (moistureLevel: number): string => {
    if (moistureLevel > 35) {
      return 'newly_harvested';
    } else if (moistureLevel >= 25 && moistureLevel <= 35) {
      return 'Moderate_level';
    } else if (moistureLevel >= 12 && moistureLevel < 25) {
      return 'dryed';
    } else {
      return 'over_dryed';
    }
  };