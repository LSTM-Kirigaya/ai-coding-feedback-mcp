import fs from 'fs';
import path from 'path';

export function findApiRoutes(root: string) {
    const results: string[] = [];

    function walk(dir: string) {
        for (const file of fs.readdirSync(dir)) {
            const full = path.join(dir, file);
            const stat = fs.statSync(full);

            if (stat.isDirectory()) walk(full);
            else if (file === 'route.ts') results.push(full);
        }
    }

    walk(root);
    return results;
}

export function ensureEntityFile(apiFolder: string) {
    const entityPath = path.join(apiFolder, 'entity.ts');

    if (!fs.existsSync(entityPath)) {
        fs.writeFileSync(
            entityPath,
            `
export interface RequestDto {}
export interface ResponseDto {}
            `.trim()
        );
    }
}
