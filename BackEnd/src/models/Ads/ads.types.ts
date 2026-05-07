export interface AdMobRewardQuery {
  custom_data?: string | string[];
  reward_amount?: string | string[];
}

export interface AdRewardResult {
  success: boolean;
  message?: string;
  energyAdded?: number;
  currentEnergy?: number;
}
