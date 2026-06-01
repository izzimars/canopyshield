import { BaseEntity } from '../../shared/utils/base-entity';

/**
 * Register request DTO
 */
export class CrowdfundingDto extends BaseEntity<CrowdfundingDto> {
  idempotencyKey!: string;
  schoolId!: string;
  amount!: number;
}

/**
 * Pagination request DTO
 */
export class PaginationDto extends BaseEntity<PaginationDto> {
  page: number = 1;
  limit: number = 10;
}
