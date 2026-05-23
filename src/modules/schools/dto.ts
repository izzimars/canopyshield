import { BaseEntity } from '../../shared/utils/base-entity';

export class IdParamDto extends BaseEntity<IdParamDto> {
  id!: string;
  riskId!: string;
}

export class RiskHistoryQueryDto extends BaseEntity<RiskHistoryQueryDto> {
  days?: number;
}

export class SchoolBodyDto extends BaseEntity<SchoolBodyDto> {
  name!: string;
  location!: string;
  treeCount?: number;
  lat?: number;
  lng?: number;
}
