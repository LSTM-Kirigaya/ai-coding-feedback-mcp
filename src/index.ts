#!/usr/bin/env node
import process from 'node:process';
import { checkBackendApi } from './checker';
import { fixApi } from './fixer';

const cmd = process.argv[2];

switch (cmd) {
    case 'check': {
        const issues = checkBackendApi('test', 'tsconfig.json');
        if (issues.length === 0) {
            console.log("✔ 所有 API 均符合规范！");
        } else {
            console.log("❌ 检查发现以下问题：");
            issues.forEach(i => console.log(` - [${i.file}] ${i.message}`));
            process.exit(1);
        }
        break;
    }
    case 'fix': {
        fixApi();
        break;
    }
    default:
        console.log("用法：");
        console.log("  npx api-lint check");
        console.log("  npx api-lint fix");
        break;
}
