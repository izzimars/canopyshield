import { BaseEntity } from '../../shared/utils/base-entity';

/**
 * Register request DTO
 */
export class verifyPaystackDto extends BaseEntity<verifyPaystackDto> {
    reference!: string;
}
