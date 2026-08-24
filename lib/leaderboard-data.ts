export interface MetaData {
  favicon: string;
  title: string;
  description: string;
  category?: string;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  bid: number;
  url: string;
  clicks: number;
  time: string;
  category?: string;
  description?: string;
  is_hidden?: boolean;
  claimed_at?: string;
}

export interface PlatformStats {
  totalVolume: number;
  totalBids: number;
  highestBid: number;
  totalListings: number;
}
