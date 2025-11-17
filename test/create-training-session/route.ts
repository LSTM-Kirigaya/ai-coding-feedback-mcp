import { NextResponse } from 'next/server';
import { getServerSession } from '../../auth/[...nextauth]/auth';
import supabase from '@/lib/supabaseClient';

// 重要！必须以 import type 引入接口类型
import type { ApiData } from '@/types/api';
import type { CreateTrainingSessionDto, CreateTrainingSessionResponseDto } from './entity';

export async function POST(req: Request) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({
            success: false,
            message: '用户未登录',
            data: null
        }, { status: 401 });
    }

    const user_id = session.user.id;

    const {
        insert
    } = await req.json() as CreateTrainingSessionDto;


    // 处理函数
    // ...


    // 重点！必须申请接口范型位 ApiData<返回参数的接口类型>
    return NextResponse.json<ApiData<CreateTrainingSessionResponseDto>>({
        success: true,
        message: '训练会话创建成功',
        // CreateTrainingSessionResponseDto 反应的就是这个地方 data 的数据结构
        data: data
    });
}