// 创建训练提醒请求和响应的类型定义

export interface TrainingReminder {
    id?: string;
    training_plan_id: string;
    reminder_type: 'daily' | 'weekly' | 'custom';
    reminder_time: string;
    days_of_week?: string[];
    is_active: boolean;
    created_at?: string;
}

export interface CreateTrainingReminderDto {
    training_plan_id: string;
    reminder_type: 'daily' | 'weekly' | 'custom';
    reminder_time: string;
    days_of_week?: string[];
    is_active: boolean;
}

export interface CreateTrainingReminderResponseDto {
    reminder: TrainingReminder;
}