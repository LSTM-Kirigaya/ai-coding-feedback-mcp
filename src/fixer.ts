import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';
import { API_ROOT, ENTITY_FILE } from './constants';
import { findApiRoutes, ensureEntityFile } from './utils';

export function fixApi() {
    const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

    const routes = findApiRoutes(API_ROOT);

    for (const routePath of routes) {
        const absPath = path.resolve(routePath);
        const source = project.addSourceFileAtPath(absPath);
        const dir = path.dirname(absPath);

        // 自动创建 entity.ts
        ensureEntityFile(dir);

        // 如果缺少 NextResponse, 注入 import
        if (!source.getText().includes("NextResponse")) {
            source.insertStatements(0, "import { NextResponse } from 'next/server';");
        }

        // 注入 getServerSession、supabase
        if (!source.getText().includes("supabase")) {
            source.insertStatements(0, "import supabase from '@/lib/supabaseClient';");
        }
        if (!source.getText().includes("getServerSession")) {
            source.insertStatements(
                0,
                "import { getServerSession } from '../../auth/[...nextauth]/auth';"
            );
        }

        // 读取 entity.ts 文件名推断 DTO 名称
        const dtoImport = "import type { RequestDto, ResponseDto } from './entity';";
        if (!source.getText().includes('./entity')) {
            source.insertStatements(0, dtoImport);
        }

        // 自动替换 body.userId
        const text = source.getFullText();
        if (text.includes("userId") && text.includes("req.json")) {
            const fixed = text.replace(/userId[\s:]*[^\n,}]*/g, '');
            fs.writeFileSync(absPath, fixed);
            continue;
        }

        // 自动注入 session 获取
        if (!text.includes("const session")) {
            source.insertStatements(
                source.getStatements().length,
                `
const session = await getServerSession();
if (!session?.user?.id) {
    return NextResponse.json({
        success: false,
        message: '用户未登录',
        data: null
    }, { status: 401 });
}
const userId = session.user.id;
                `.trim()
            );
        }

        // 如果返回不是 ApiData，修复为符合格式
        if (!text.includes("ApiData<")) {
            source.addStatements(`
return NextResponse.json<ApiData<ResponseDto>>({
    success: true,
    message: 'OK',
    data: null
});
            `);
        }

        source.saveSync();
    }

    console.log("✨ API 修复完成！");
}
