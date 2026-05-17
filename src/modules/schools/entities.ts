import { BaseEntity } from '../../shared/utils/base-entity';

export class SchoolEntity extends BaseEntity<SchoolEntity> {
  school_uuid!: string;
  name!: string;
  address?: string;
  contact_email?: string;
  lat!: number;
  lng!: number;
  current_risk_score!: number;
  status!: string;
  tree_count!: number;
  created_at!: string;
  updated_at!: string;
}

export class RiskSnapshotEntity extends BaseEntity<RiskSnapshotEntity> {
  risk_uuid!: string;
  school_id!: string;
  score!: number;
  heat_score!: number;
  aqi_score!: number;
  raw_data!: Record<string, unknown>;
  created_at!: string;
}

export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  cloudCover: number;
  uvIndex?: number;
}

export interface WeatherForecastPoint {
  timestamp: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  cloudCover: number;
}

export interface AirPollutionData {
  pm2_5?: number;
  pm10?: number;
}

export interface ComputedRisk {
  heatScore: number;
  aqiScore: number;
  combinedScore: number;
  metadata: Record<string, unknown>;
}
