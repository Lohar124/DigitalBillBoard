export interface MetaData {
  favicon: string;
  title: string;
  description: string;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  bid: number;
  url: string;
  clicks: number;
  time: string;
}
