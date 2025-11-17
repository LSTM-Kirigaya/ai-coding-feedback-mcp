// 请求参数的接口类型
export interface CreateTodaySessionDto {
    training_plan_id: string;
}

// 返回参数的接口类型
export interface CreateTodaySessionResponseDto {
    message: string;
    data: any;
}