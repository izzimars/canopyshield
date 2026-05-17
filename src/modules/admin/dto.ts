import { z } from 'zod';
import { BaseEntity } from '../../shared/utils/base-entity';

export class ConfirmTreeDto extends BaseEntity<ConfirmTreeDto> {
  treeRequestId: string;

  constructor(payload: any) {
    super();
    this.treeRequestId = payload?.treeRequestId;
  }
}

export class CreateSchoolDto extends BaseEntity<CreateSchoolDto> {
  name: string;
  location: string;
  latitude: number;
  longitude: number;

  constructor(payload: any) {
    super();
    this.name = payload?.name;
    this.location = payload?.location;
    this.latitude = payload?.latitude;
    this.longitude = payload?.longitude;
  }
}

export class UpdateSchoolDto extends BaseEntity<UpdateSchoolDto> {
  name: string;
  location: string;
  latitude: number;
  longitude: number;

  constructor(payload: any) {
    super();
    this.name = payload?.name;
    this.location = payload?.location;
    this.latitude = payload?.latitude;
    this.longitude = payload?.longitude;
  }
}

// Zod validation schemas
export const confirmTreeSchema = z.object({
  treeRequestId: z.string().uuid('Invalid tree request ID'),
});

export const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  location: z.string().min(1, 'Location is required'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
});

export const updateSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  latitude: z.number().min(-90).max(90, 'Invalid latitude').optional(),
  longitude: z.number().min(-180).max(180, 'Invalid longitude').optional(),
});
