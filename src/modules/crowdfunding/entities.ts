export interface TreeContributionEntity {
  id: number;
  contribution_uuid: string;
  user_id: string;
  school_id: string;
  amount: number;
  idempotency_key: string;
  created_at: string;
  processed_at: Date | null;
  status: 'pending' | 'completed';
  payment_reference: string;
}

export interface SchoolCrowdfundingEntity {
  school_id: string;
  current_balance: number;
  total_contributed: number;
  updated_at: string;
}

export interface UserCrowdfundingStatsEntity {
  user_id: string;
  total_contributed: number;
  trees_funded: number;
  updated_at: string;
}

export interface TreeContributionResponse {
  new_trees_planted: number;
  school_current_balance: number;
  user_trees_funded: number;
}

export interface FinalizeTreeContributionResponse {
  treesPlanted: number;
  balance: number;
}

export interface UserContributionsResponse {
  total_contributed: number;
  trees_funded: number;
  contributions: TreeContributionEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SchoolContributionsResponse {
  current_balance: number;
  total_contributed: number;
  total_trees_planted_via_crowdfunding: number;
}
