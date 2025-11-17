import { Database } from "@/types/database.types";

type TrainingSessionInsert = Database['public']['Tables']['training_sessions']['Insert'];

// 请求参数的接口类型
export interface CreateTrainingSessionDto {
    insert: TrainingSessionInsert;
}

// 返回参数的接口类型
export type CreateTrainingSessionResponseDto = TrainingSessionInsert;