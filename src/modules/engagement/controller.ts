import { Request, Response } from 'express';
import ResponseHelper from '../../shared/utils/response';
import { quizService, shareService, donationService } from './services';
import { CreateQuizDto, QuizAnswerDto, DonateDto } from './dto';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../config/logger';

export class EngagementController {
  async getToday(_req: Request, res: Response) {
    logger.info('engagement::controller::getToday');
    const q = await quizService.getTodayQuestion();
    if (!q) return void res.status(StatusCodes.NOT_FOUND).json(ResponseHelper.error('NO_QUIZ', 'No quiz found'));
    return void res.status(StatusCodes.OK).json(ResponseHelper.success(q));
  }

  async postAnswer(req: Request, res: Response) {
    logger.info('engagement::controller::postAnswer');
    const payload = new QuizAnswerDto(req.body);
    const userId = (req as any).claim?.user_uuid || (req as any).claim?.user?.user_uuid || (req as any).claim?.id;
    if (!userId) return void res.status(StatusCodes.UNAUTHORIZED).json(ResponseHelper.error('AUTH_MISSING', 'User not authenticated'));

    const result = await quizService.attemptQuiz(userId, payload.quizId, payload.selectedOption);
    if (!result.success) {
      const errorMsg = 'message' in result ? result.message : 'Quiz failed';
      return void res.status(StatusCodes.BAD_REQUEST).json(ResponseHelper.error('QUIZ_ERROR', errorMsg));
    }
    const successResult = result as { success: boolean; correct: boolean; points: number };
    return void res.status(StatusCodes.OK).json(ResponseHelper.success({ correct: successResult.correct, points: successResult.points }));
  }

  async createQuestion(req: Request, res: Response) {
    logger.info('engagement::controller::createQuestion');
    const payload = new CreateQuizDto(req.body);
    const created = await quizService.createQuestion({ questionText: payload.questionText, options: payload.options, correctOptionIndex: payload.correctOptionIndex, topicTag: payload.topicTag });
    return void res.status(StatusCodes.CREATED).json(ResponseHelper.success(created));
  }

  async share(req: Request, res: Response) {
    logger.info('engagement::controller::share');
    const userId = (req as any).claim?.user_uuid || (req as any).claim?.user?.user_uuid || (req as any).claim?.id;
    if (!userId) return void res.status(StatusCodes.UNAUTHORIZED).json(ResponseHelper.error('AUTH_MISSING', 'User not authenticated'));
    const r = await shareService.share(userId);
    if (!r.success) {
      const errorMsg = 'message' in r ? (r.message as string) : 'Share failed';
      return void res.status(StatusCodes.BAD_REQUEST).json(ResponseHelper.error('SHARE_ERROR', errorMsg));
    }
    return void res.status(StatusCodes.OK).json(ResponseHelper.success({ points: r.points }));
  }

  async donate(req: Request, res: Response) {
    logger.info('engagement::controller::donate');
    const payload = new DonateDto(req.body);
    const userId = (req as any).claim?.user_uuid || (req as any).claim?.user?.user_uuid || (req as any).claim?.id;
    if (!userId) return void res.status(StatusCodes.UNAUTHORIZED).json(ResponseHelper.error('AUTH_MISSING', 'User not authenticated'));

    const schoolId = payload.schoolId as string;
    if (!schoolId) return void res.status(StatusCodes.BAD_REQUEST).json(ResponseHelper.error('MISSING_PARAM', 'School ID is required'));

    const r = await donationService.donate(userId, schoolId, payload.pointsToDonate);
    if (!r.success) {
      const errorMsg = (('message' in r ? r.message : 'Donation failed') as string) || 'Donation failed';
      return void res.status(StatusCodes.BAD_REQUEST).json(ResponseHelper.error('DONATE_ERROR', errorMsg));
    }
    const successResult = r as { success: boolean; userPoints?: number; schoolTotal?: number };
    return void res.status(StatusCodes.OK).json(ResponseHelper.success({ userPoints: successResult.userPoints, schoolTotal: successResult.schoolTotal }));
  }
}

export const engagementController = new EngagementController();
export default engagementController;
