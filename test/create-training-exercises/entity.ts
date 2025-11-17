import { Database } from "@/types/database.types";

export type TrainingExerciseInsert = Database['public']['Tables']['training_exercises']['Insert'];

// 请求参数的接口类型
export interface CreateTrainingExercisesDto {
    training_session_id: string;
    insert: TrainingExerciseInsert | TrainingExerciseInsert[];
}

export interface TrainingExercise {
    training_session_id: string;
    exercise_name: string;
    exercise_type: 'main' | 'accessory' | 'warmup' | 'cooldown';
    sets_planned: number;
    reps_planned: string;
    load_planned?: number;
    rest_time?: number;
    notes?: string;
}

// 返回参数的接口类型
export interface CreateTrainingExercisesResponseDto {
    message: string;
    data: string;
}