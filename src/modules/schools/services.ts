import axios from 'axios';
import { OPENWEATHERMAP_API_KEY, OPENAQ_API_KEY } from '../../config/env';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import {
  AirPollutionData,
  ComputedRisk,
  SchoolEntity,
  WeatherCurrent,
  WeatherForecastPoint,
  RiskSnapshotEntity,
} from './entities';
import { riskSnapshotRepository, schoolRepository } from './repositories';
import { pushNotificationService } from '../push/service';
import { NotFoundException, InternalServerErrorException } from '../../shared/errors';

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
  getRiskById(riskId: string): Promise<RiskSnapshotEntity | NotFoundException>;
  createNewSchool(name: string, location: string, status: string, treeCount?: number, lng?: number, lat?: number): Promise<SchoolEntity>;
  getSchoolRisk(uuid: string): Promise<{ risk: [] | any } | NotFoundException>;
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

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

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

  // async fetchAirPollution(lat: number, lon: number): Promise<AirPollutionData | null> {
  //   try {
  //     logger.info('schools::services::fetchAirPollution');
  //     const response = await axios.get(OWM_AIR_URL, {
  //       params: {
  //         lat,
  //         lon,
  //         appid: OPENWEATHERMAP_API_KEY,
  //       },
  //       timeout: 15000,
  //     });

  //     const first = Array.isArray(response.data?.list) ? response.data.list[0] : null;
  //     if (!first) {
  //       return null;
  //     }

  //     return {
  //       pm2_5: first?.components?.pm2_5,
  //       pm10: first?.components?.pm10,
  //     };
  //   } catch (error) {
  //     logger.warn('OWM air pollution unavailable; falling back to moderate AQI', { error: (error as Error).message });
  //     return null;
  //   }
  // }

// weatherService.ts

  async fetchAirPollution(lat: number, lng: number): Promise<AirPollutionData | null> {
  try {
    logger.info('schools::services::fetchAirPollution - trying OpenAQ');

    // 1. Find nearest stations
    const locationResponse = await axios.get(
      'https://api.openaq.org/v3/locations',
      {
        params: {
          coordinates: `${lat},${lng}`,
          radius: 25000,
          limit: 5,
        },
        headers: { 'X-API-Key': OPENAQ_API_KEY! },
      }
    );

    const locationData = locationResponse.data;

    if (!locationData.results || locationData.results.length === 0) {
      // No station nearby — fallback
      return this.fetchAirPollutionFallback(lat, lng);
    }

    // 2. Get latest measurements from the closest station
    const locationId = locationData.results[0].id;
    const measurementsResponse = await axios.get(
      `https://api.openaq.org/v3/locations/${locationId}/latest`,
      {
        headers: { 'X-API-Key': OPENAQ_API_KEY! },
      }
    );

    const measurementsData = measurementsResponse.data;
    const results = measurementsData.results ?? [];

    const pm2_5 = results.find((r: any) => r.parameter === 'pm25')?.value ?? null;
    const pm10 = results.find((r: any) => r.parameter === 'pm10')?.value ?? null;

    // 3. If station exists but has no PM data, fallback
    if (pm2_5 === null && pm10 === null) {
      return this.fetchAirPollutionFallback(lat, lng);
    }

    return { pm2_5, pm10 };
  } catch (error: any) {
    logger.error('OpenAQ fetch failed', {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data || error.message,
    });
    return this.fetchAirPollutionFallback(lat, lng);
  }
}

// Fallback: OpenWeatherMap with Lagos correction factor
  private async fetchAirPollutionFallback(lat: number, lng: number): Promise<AirPollutionData | null> {
    try {
      logger.info('schools::services::fetchAirPollution - trying OpenWeatherMap');
      const response = await axios.get(
        'https://api.openweathermap.org/data/2.5/air_pollution',
        {
          params: {
            lat: lat,
            lon: lng,
            appid: OPENWEATHERMAP_API_KEY,
          },
        }
      );

      const components = response.data.list?.[0]?.components;

      if (!components) return null;

    // Apply Lagos urban correction factor
      return {
        pm2_5: components.pm2_5 * 45,
        pm10: components.pm10 * 20,
      };
    } catch (error) {
      logger.error('OpenWeatherMap air pollution fetch failed during fallback', { error: (error as Error).message });
      return null;
    }
  }
}

export class RiskScoringServiceImpl implements RiskScoringService {
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private linearNormalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    const ratio = (value - min) / (max - min);
    return this.clamp(ratio * 100, 0, 100);
  }

  /**
   * PM2.5 → AQI (0–500) using EPA breakpoints
   */
  private pm25Aqi(pm25: number): number {
    if (pm25 <= 12.0) return this.linearNormalize(pm25, 0, 12.0) * 0.5;
    if (pm25 <= 35.4) return 50 + (pm25 - 12.0) / (35.4 - 12.0) * 50;
    if (pm25 <= 55.4) return 100 + (pm25 - 35.4) / (55.4 - 35.4) * 50;
    if (pm25 <= 150.4) return 150 + (pm25 - 55.4) / (150.4 - 55.4) * 50;
    if (pm25 <= 250.4) return 200 + (pm25 - 150.4) / (250.4 - 150.4) * 100;
    if (pm25 <= 350.4) return 300 + (pm25 - 250.4) / (350.4 - 250.4) * 100;
    if (pm25 <= 500.4) return 400 + (pm25 - 350.4) / (500.4 - 350.4) * 100;
    return 500;
  }

  /**
   * PM10 → AQI (0–500) using EPA breakpoints
   */
  private pm10Aqi(pm10: number): number {
    if (pm10 <= 54) return (pm10 / 54) * 50;
    if (pm10 <= 154) return 50 + (pm10 - 54) / (154 - 54) * 50;
    if (pm10 <= 254) return 100 + (pm10 - 154) / (254 - 154) * 50;
    if (pm10 <= 354) return 150 + (pm10 - 254) / (354 - 254) * 50;
    if (pm10 <= 424) return 200 + (pm10 - 354) / (424 - 354) * 100;
    if (pm10 <= 504) return 300 + (pm10 - 424) / (504 - 424) * 100;
    if (pm10 <= 604) return 400 + (pm10 - 504) / (604 - 504) * 100;
    return 500;
  }

  computeRisk(current: WeatherCurrent, air: AirPollutionData | null): ComputedRisk {
    // 1. Heat‑related score (0–100)
    const feelsLikeScore = this.linearNormalize(current.feelsLike, 22, 48);
    const uvRaw = typeof current.uvIndex === 'number'
      ? current.uvIndex
      : ((100 - this.clamp(current.cloudCover, 0, 100)) / 100) * 11;
    const uvNormalized = this.linearNormalize(uvRaw, 0, 11);
    const humidityNormalized = this.linearNormalize(current.humidity, 30, 95);
    const heatScore = this.clamp(
      (feelsLikeScore * 0.5) + (uvNormalized * 0.3) + (humidityNormalized * 0.2),
      0, 100
    );

    // 2. Air quality score on real AQI scale (0–500)
    let aqiScore = 50; // default moderate
    if (air && typeof air.pm2_5 === 'number' && typeof air.pm10 === 'number') {
      const pm25Aqi = this.pm25Aqi(air.pm2_5);
      const pm10Aqi = this.pm10Aqi(air.pm10);
      aqiScore = Math.max(pm25Aqi, pm10Aqi);
    }

    // 3. Scale heatScore to match AQI range (0–500)
    const heatScoreScaled = heatScore * 5; // 0–100 → 0–500

    // 4. Combine on the 0–500 scale (no rounding)
    const combinedScore = this.clamp(
      Math.max(heatScoreScaled, aqiScore) * 0.6 + Math.min(heatScoreScaled, aqiScore) * 0.4,
      0, 500
    );

    // Logging (optional)
    logger.info(`Risk computation: heatScore (0-100) = ${heatScore.toFixed(2)} → scaled = ${heatScoreScaled.toFixed(2)}`);
    logger.info(`AQI score (0-500) = ${aqiScore.toFixed(2)}`);
    logger.info(`Combined risk (0-500) = ${combinedScore.toFixed(2)}`);

    return {
      heatScore,           // raw float, 0–100
      aqiScore,           // raw float, 0–500
      combinedScore,      // raw float, 0–500
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

  async getSchoolRisk(uuid: string): Promise<{ risk: [] | any } | NotFoundException> {
    logger.info('schools::services::getSchoolRisk');
    const school = await schoolRepository.findByUuId(uuid);
    if (school instanceof NotFoundException) {
      return new NotFoundException('School not found');
    }

    const riskHistory = await riskSnapshotRepository.findRiskBySchoolId(uuid);
    return { risk: riskHistory instanceof NotFoundException ? [] : riskHistory }; 
  }

  async getRiskById(riskId: string): Promise<RiskSnapshotEntity | NotFoundException> {
    logger.info('schools::services::getRiskById');
    return riskSnapshotRepository.findByRiskId(riskId);
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
        predictedRisk: roundToTwoDecimals(computed.combinedScore),
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
      const weatherCache = null //await redis.get(weatherCacheKey);

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

        console.log('Fetched weather and air data for school:');
        await redis.set(weatherCacheKey, JSON.stringify({ current, forecast, air }), 'EX', 1500);
      }

      const computed = this.scoringService.computeRisk(current, air);
      const roundedScore = roundToTwoDecimals(computed.combinedScore);

      await riskSnapshotRepository.create({
        schoolId: school.school_uuid,
        score: roundedScore,
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

      await schoolRepository.updateRiskScore(school.school_uuid, roundedScore);

      return roundedScore;
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
