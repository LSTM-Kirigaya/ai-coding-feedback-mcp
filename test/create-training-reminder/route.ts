import { NextResponse } from 'next/server';
import { getServerSession } from '../../auth/[...nextauth]/auth';
import supabase from '@/lib/supabaseClient';
import { CreateTrainingReminderDto } from './entity';

export async function POST(req: Request) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({
            success: false,
            message: '用户未登录',
            data: null
        }, { status: 401 });
    }

    const userId = session.user.id;
    const {
        training_plan_id: trainingPlanId,
        reminder_type: reminderType,
        reminder_time: reminderTime,
        days_of_week: daysOfWeek,
        is_active: isActive
    } = await req.json() as CreateTrainingReminderDto;

    // 处理函数
    // ...

    return NextResponse.json({
        success: true,
        message: '创建训练提醒成功',
        data: {
            reminder: data
        }
    });

}