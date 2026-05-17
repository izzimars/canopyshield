import { BaseEntity } from '../../shared/utils/base-entity';

export class QuizAnswerDto extends BaseEntity<QuizAnswerDto> {
  quizId!: string;
  selectedOption!: number;
}

export class CreateQuizDto extends BaseEntity<CreateQuizDto> {
  questionText!: string;
  options!: any[];
  correctOptionIndex!: number;
  topicTag!: string;
}

export class ShareDto extends BaseEntity<ShareDto> {
  // no body required for one-step share
}

export class DonateDto extends BaseEntity<DonateDto> {
  schoolId!: string;
  pointsToDonate!: number;
}
