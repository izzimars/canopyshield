import { BaseEntity } from '../../shared/utils/base-entity';

export class approveDto extends BaseEntity<approveDto> {
  status!: 'approved' | 'rejected';
}
