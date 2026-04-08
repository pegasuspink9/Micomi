export interface SocialProfileResponse {
  player_name: string;
  player_avatar: string;
  username: string;
  coins: number;
  current_streak: number;
  exp_points: number;
  player_level: number;
  friends_count: number;
  max_level_exp: number;
  ownedCharacters: any[];
  selectedBadge: any;
  latestAchievement: any;
  playerAchievements: any[];
  totalActiveMaps: number;
  mapsPlayed: string[];

  relation_status:
    | "self"
    | "friend"
    | "outgoing_pending"
    | "incoming_pending"
    | "none";
}
