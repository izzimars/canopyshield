import axios from 'axios';
import { OPENWEATHERMAP_API_KEY } from '../../config/env';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import {
  AirPollutionData,
  ComputedRisk,
  SchoolEntity,
  WeatherCurrent,
  WeatherForecastPoint,
} from './entities';
import { riskSnapshotRepository, schoolRepository } from './repositories';
import { pushNotificationService } from '../push/service';
import { BadException, NotFoundException, UnAuthorizedException, InternalServerErrorException, ProviderException } from '../../shared/errors';

export interface OpenWeatherMapService {
  fetchCurrentWeather(lat: number, lon: number): Promise<WeatherCurrent>;
  fetchForecast(lat: number, lon: number): Promise<WeatherForecastPoint[]>;
  fetchAirPollution(lat: number, lon: number): Promise<AirPollutionData | null>;
}

export interface RiskScoringService {
  computeRisk(current: WeatherCurrent, air: AirPollutionData | null): ComputedRisk;
}

export interface SchoolRiskService {
  getAllSchools(statusfilter: Array<string>): Promise<SchoolEntity[]>;
  createNewSchool(name: string, location: string, status: string, treeCount?: number, lng?: number, lat?: number): Promise<SchoolEntity>;
  getSchoolRisk(uuid: string): Promise<{ latest: any | null; lastFive: any[] } | NotFoundException>;
  getRiskHistory(uuid: string, days?: number): Promise<any[] | NotFoundException>;
  getPrediction(uuid: string): Promise<{ school_id: string; horizonHours: number; points: any[] } | NotFoundException>;
  getRiskLeaderboard(statusFilter: Array<string>): Promise<any[]>;
  getTreesLeaderboard(statusFilter: Array<string>): Promise<any[]>;
  getSchoolTrees(uuid: string): Promise<{ school_id: string; tree_count: number } | NotFoundException>;
  recomputeAllSchoolsRisk(): Promise<void | NotFoundException>;
  recomputeSchoolRisk(school: SchoolEntity): Promise<number | null | NotFoundException>;
}

const OWM_CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OWM_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const OWM_AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

class OpenWeatherMapServiceImpl implements OpenWeatherMapService {
  async fetchCurrentWeather(lat: number, lon: number): Promise<WeatherCurrent> {
    logger.info('schools::services::fetchCurrentWeather');
    const response = await axios.get(OWM_CURRENT_URL, {
      params: {
        lat,
        lon,
        appid: OPENWEATHERMAP_API_KEY,
        units: 'metric',
      },
      timeout: 15000,
    });

    const data = response.data;
    return {
      temp: data?.main?.temp ?? 0,
      feelsLike: data?.main?.feels_like ?? 0,
      humidity: data?.main?.humidity ?? 0,
      cloudCover: data?.clouds?.all ?? 0,
      uvIndex: undefined,
    };
  }

  async fetchForecast(lat: number, lon: number): Promise<WeatherForecastPoint[]> {
    logger.info('schools::services::fetchForecast');
    const response = await axios.get(OWM_FORECAST_URL, {
      params: {
        lat,
        lon,
        appid: OPENWEATHERMAP_API_KEY,
        units: 'metric',
      },
      timeout: 15000,
    });

    const points = Array.isArray(response.data?.list) ? response.data.list : [];
    return points.slice(0, 8).map((item: any) => ({
      timestamp: item?.dt_txt ?? new Date().toISOString(),
      temp: item?.main?.temp ?? 0,
      feelsLike: item?.main?.feels_like ?? 0,
      humidity: item?.main?.humidity ?? 0,
      cloudCover: item?.clouds?.all ?? 0,
    }));
  }

  async fetchAirPollution(lat: number, lon: number): Promise<AirPollutionData | null> {
    try {
      logger.info('schools::services::fetchAirPollution');
      const response = await axios.get(OWM_AIR_URL, {
        params: {
          lat,
          lon,
          appid: OPENWEATHERMAP_API_KEY,
        },
        timeout: 15000,
      });

      const first = Array.isArray(response.data?.list) ? response.data.list[0] : null;
      if (!first) {
        return null;
      }

      return {
        pm2_5: first?.components?.pm2_5,
        pm10: first?.components?.pm10,
      };
    } catch (error) {
      logger.warn('OWM air pollution unavailable; falling back to moderate AQI', { error: (error as Error).message });
      return null;
    }
  }
}

class RiskScoringServiceImpl implements RiskScoringService {
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private linearNormalize(value: number, min: number, max: number): number {
    if (max === min) {
      return 0;
    }
    const ratio = (value - min) / (max - min);
    return this.clamp(ratio * 100, 0, 100);
  }

  private pm25Score(pm25: number): number {
    if (pm25 <= 5) return this.linearNormalize(pm25, 0, 5) * 0.2;
    if (pm25 <= 15) return 20 + this.linearNormalize(pm25, 5, 15) * 0.2;
    if (pm25 <= 25) return 40 + this.linearNormalize(pm25, 15, 25) * 0.2;
    if (pm25 <= 50) return 60 + this.linearNormalize(pm25, 25, 50) * 0.2;
    return this.clamp(80 + this.linearNormalize(pm25, 50, 100) * 0.2, 0, 100);
  }

  private pm10Score(pm10: number): number {
    if (pm10 <= 15) return this.linearNormalize(pm10, 0, 15) * 0.2;
    if (pm10 <= 45) return 20 + this.linearNormalize(pm10, 15, 45) * 0.2;
    if (pm10 <= 60) return 40 + this.linearNormalize(pm10, 45, 60) * 0.2;
    if (pm10 <= 100) return 60 + this.linearNormalize(pm10, 60, 100) * 0.2;
    return this.clamp(80 + this.linearNormalize(pm10, 100, 200) * 0.2, 0, 100);
  }

  computeRisk(current: WeatherCurrent, air: AirPollutionData | null): ComputedRisk {
    const feelsLikeScore = this.linearNormalize(current.feelsLike, 15, 35);

    const uvRaw = typeof current.uvIndex === 'number'
      ? current.uvIndex
      : ((100 - this.clamp(current.cloudCover, 0, 100)) / 100) * 11;

    const uvNormalized = this.linearNormalize(uvRaw, 0, 11);
    const humidityNormalized = this.clamp(100 - current.humidity, 0, 100);

    const heatScore = this.clamp((feelsLikeScore * 0.5) + (uvNormalized * 0.3) + (humidityNormalized * 0.2), 0, 100);

    let aqiScore = 50;
    if (air && typeof air.pm2_5 === 'number' && typeof air.pm10 === 'number') {
      aqiScore = this.clamp(Math.max(this.pm25Score(air.pm2_5), this.pm10Score(air.pm10)), 0, 100);
    }

    const combinedScore = this.clamp(
      Math.max(heatScore, aqiScore) * 0.6 + Math.min(heatScore, aqiScore) * 0.4,
      0,
      100
    );

    return {
      heatScore: Math.round(heatScore),
      aqiScore: Math.round(aqiScore),
      combinedScore: Math.round(combinedScore),
      metadata: {
        feelsLike: current.feelsLike,
        uvRaw,
        humidity: current.humidity,
        pm2_5: air?.pm2_5 ?? null,
        pm10: air?.pm10 ?? null,
      },
    };
  }
}

class SchoolRiskServiceImpl implements SchoolRiskService {
  constructor(
    private readonly weatherService: OpenWeatherMapService,
    private readonly scoringService: RiskScoringService
  ) {}

  async getAllSchools(statusfilter: Array<string>): Promise<SchoolEntity[]> {
    logger.info('schools::services::getAllSchools');
    const cacheKey = `schools:all:${statusfilter.sort().join(',')}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as SchoolEntity[];
    }

    const schools = await schoolRepository.findAll(statusfilter);
    await redis.set(cacheKey, JSON.stringify(schools), 'EX', 300);
    return schools;
  }

  async createNewSchool(name: string, location: string, status: string, treeCount?: number, lng?: number, lat?: number) {
    logger.info('admin::services::createSchool');
    const school = await schoolRepository.createSchool(name, location, treeCount, lng, lat, status);
    logger.info(`School created: ${school.school_uuid} - ${name}`);
    return school;
  }

  async getSchoolRisk(uuid: string): Promise<{ latest: any | null; lastFive: any[] } | NotFoundException> {
    logger.info('schools::services::getSchoolRisk');
    const school = await schoolRepository.findByUuId(uuid);
    if (school instanceof NotFoundException) {
      return new NotFoundException('School not found');
    }

    const snapshots = await riskSnapshotRepository.findLatest(uuid, 6);
    return {
      latest: snapshots.length > 0 ? snapshots[0] : null,
      lastFive: snapshots.slice(1),
    };
  }

  async getRiskHistory(uuid: string, days = 7): Promise<any[] | NotFoundException> {
    logger.info('schools::services::getRiskHistory');
    const school = await schoolRepository.findByUuId(uuid);
    if (school instanceof NotFoundException) {
      return school;
    }

    return riskSnapshotRepository.findHistory(uuid, days);
  }

  async getPrediction(uuid: string): Promise<{ school_id: string; horizonHours: number; points: any[] } | NotFoundException> {
    logger.info('schools::services::getPrediction');
    const school = await schoolRepository.findByUuId(uuid);
    if (!school) {
      return new NotFoundException('School not found');
    }

    const forecast = await this.weatherService.fetchForecast(Number(school.lat), Number(school.lng));

    const points = forecast.map((point) => {
      const computed = this.scoringService.computeRisk({
        temp: point.temp,
        feelsLike: point.feelsLike,
        humidity: point.humidity,
        cloudCover: point.cloudCover,
      }, null);

      return {
        timestamp: point.timestamp,
        predictedRisk: computed.combinedScore,
      };
    });

    return {
      school_id: school.school_uuid,
      horizonHours: 24,
      points,
    };
  }

  async getRiskLeaderboard(statusFilter: Array<string>): Promise<any[]> {
    logger.info('schools::services::getRiskLeaderboard');
    const cacheKey = 'leaderboard:risk';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = await schoolRepository.findRiskLeaderboard(statusFilter);
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
    return data;
  }

  async getTreesLeaderboard(statusFilter: Array<string>): Promise<any[]> {
    logger.info('schools::services::getTreesLeaderboard');
    const cacheKey = 'leaderboard:trees';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = await schoolRepository.findTreesLeaderboard(statusFilter);
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
    return data;
  }

  async getSchoolTrees(id: string): Promise<{ school_id: string; tree_count: number } | NotFoundException> {
    logger.info('schools::services::getSchoolTrees');
    const school = await schoolRepository.findById(id);
    if (school instanceof NotFoundException) {
      return school;
    }

    return {
      school_id: school.school_uuid,
      tree_count: school.tree_count,
    };
  }

  async recomputeSchoolRisk(school: SchoolEntity): Promise<number | null | NotFoundException> {
    logger.info('schools::services::recomputeSchoolRisk');
    const weatherCacheKey = `weather:${school.school_uuid}`;

    try {
      const weatherCache = await redis.get(weatherCacheKey);

      let current: WeatherCurrent;
      let forecast: WeatherForecastPoint[];
      let air: AirPollutionData | null;

      if (weatherCache) {
        const parsed = JSON.parse(weatherCache) as {
          current: WeatherCurrent;
          forecast: WeatherForecastPoint[];
          air: AirPollutionData | null;
        };
        current = parsed.current;
        forecast = parsed.forecast;
        air = parsed.air;
      } else {
        const lat = Number(school.lat);
        const lng = Number(school.lng);

        const [freshCurrent, freshForecast, freshAir] = await Promise.all([
          this.weatherService.fetchCurrentWeather(lat, lng),
          this.weatherService.fetchForecast(lat, lng),
          this.weatherService.fetchAirPollution(lat, lng),
        ]);

        current = freshCurrent;
        forecast = freshForecast;
        air = freshAir;

        await redis.set(weatherCacheKey, JSON.stringify({ current, forecast, air }), 'EX', 1500);
      }

      const computed = this.scoringService.computeRisk(current, air);

      await riskSnapshotRepository.create({
        schoolId: school.school_uuid,
        score: computed.combinedScore,
        heatScore: computed.heatScore,
        aqiScore: computed.aqiScore,
        rawData: {
          current,
          forecast,
          air,
          scoring: computed.metadata,
        },
        rawTemp: current.temp,
        rawHumidity: current.humidity,
        rawUv: typeof current.uvIndex === 'number' ? current.uvIndex : (100 - current.cloudCover) / 100 * 11,
        rawAqi: computed.aqiScore,
      });

      await schoolRepository.updateRiskScore(school.school_uuid, computed.combinedScore);

      return computed.combinedScore;
    } catch (error) {
      logger.error('Failed to update school risk; keeping previous score', {
        schoolId: school.school_uuid,
        error: (error as Error).message,
      });
      return new InternalServerErrorException('Failed to compute risk for school');
    }
  }

  async recomputeAllSchoolsRisk(): Promise<void | NotFoundException> {
    logger.info('schools::services::recomputeAllSchoolsRisk');
    const schools = await schoolRepository.findAll(['approved']);

    for (const school of schools) {
      const updated = await this.recomputeSchoolRisk(school);
      if (updated instanceof NotFoundException) {
        return updated;
      }

      if (updated !== null) {
        logger.info('School risk updated', {
          schoolId: school.school_uuid,
          score: updated,
        });

        await pushNotificationService.sendToSchoolUsers(school.school_uuid, updated, {
          title: 'High Risk Alert',
          body: `Risk level ${updated} at your school`,
          url: `/schools/${school.school_uuid}/risk`,
          eventType: 'risk-exceeded',
          dedupId: `${school.school_uuid}:${new Date().toISOString().slice(0, 10)}`,
          dedupTtlSeconds: 24 * 60 * 60,
          data: { schoolId: school.school_uuid, riskScore: updated },
        });
      }
    }

    await redis.del('schools:all', 'leaderboard:risk', 'leaderboard:trees');
    logger.info('Risk caches invalidated after risk recomputation');

    logger.info('Alert dispatch completed for updated schools');
  }
}

const openWeatherMapService = new OpenWeatherMapServiceImpl();
const riskScoringService = new RiskScoringServiceImpl();
const schoolRiskService: SchoolRiskService = new SchoolRiskServiceImpl(openWeatherMapService, riskScoringService);

export default schoolRiskService;
