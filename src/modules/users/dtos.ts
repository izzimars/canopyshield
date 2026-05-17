import { BaseEntity } from '../../shared/utils/base-entity';

export class UpdateAlertsDto extends BaseEntity<UpdateAlertsDto> {
    risk_threshold?: number;
    channels?: string[];
    frequency?: string;
}
