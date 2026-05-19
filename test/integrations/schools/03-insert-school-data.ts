// 03-insert-school-data.test.ts
import { expect } from 'chai';
import { riskSnapshotRepository, schoolRepository } from '../../../src/modules/schools/repositories';

describe('Insert test school risk data', () => {
  before(async () => {
    const schoolOneUuid = process.env.SCHOOL_ONE_UUID;
    const schoolTwoUuid = process.env.SCHOOL_TWO_UUID;

    if (schoolOneUuid) {
      await riskSnapshotRepository.create({
        schoolId: schoolOneUuid,
        score: 75,
        heatScore: 80,
        aqiScore: 70,
        rawData: {},
        rawTemp: 30,
        rawHumidity: 50,
        rawUv: 6,
        rawAqi: 2,
      });
      await schoolRepository.updateRiskScore(schoolOneUuid, 75);
    }

    if (schoolTwoUuid) {
      await riskSnapshotRepository.create({
        schoolId: schoolTwoUuid,
        score: 60,
        heatScore: 65,
        aqiScore: 55,
        rawData: {},
        rawTemp: 28,
        rawHumidity: 60,
        rawUv: 5,
        rawAqi: 3,
      });
      await schoolRepository.updateRiskScore(schoolTwoUuid, 60);
    }

  });

  // Dummy test – Mocha needs at least one `it` to run the `before` hook
  it('should have inserted risk data', () => {
    expect(true).to.be.true;
  });
});