import { Node, Project, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs";
import { findApiRoutes } from "./utils";

export interface Issue {
    file: string;
    message: string;
}

export function checkBackendApi(
    folder: string,
    tsConfigFilePath: string
): Issue[] {
    const issues: Issue[] = [];
    const project = new Project({ tsConfigFilePath });
    const routes = findApiRoutes(folder);

    for (const routePath of routes) {
        const absPath = path.resolve(routePath);
        const source = project.addSourceFileAtPath(absPath);

        // -----------------------------
        // Route 所在目录信息
        // -----------------------------
        const dir = path.dirname(absPath);
        const folderName = path.basename(dir); // get-user-profile
        const pascalName = folderName
            .split("-")
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
            .join("");

        const dtoName = `${pascalName}Dto`;
        const respDtoName = `${pascalName}ResponseDto`;

        const entityFilePath = path.join(dir, "entity.ts");

        // -----------------------------
        // R1: 是否调用 NextResponse.json()
        // -----------------------------
        const hasNextResponseJson = source
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .some(call => {
                const exp = call.getExpression();
                return Node.isPropertyAccessExpression(exp)
                    && exp.getExpression().getText() === "NextResponse"
                    && exp.getName() === "json";
            });

        if (!hasNextResponseJson) {
            issues.push({ file: routePath, message: "缺少 NextResponse.json() 返回" });
        }

        // -----------------------------
        // R3: getServerSession()
        // -----------------------------
        const hasGetServerSession = source
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .some(call => call.getExpression().getText() === "getServerSession");

        if (!hasGetServerSession) {
            issues.push({ file: routePath, message: "缺少 getServerSession()" });
        }

        // -----------------------------
        // R4: req.json() 的解构是否含 userId
        // -----------------------------
        const variableDecls = source.getDescendantsOfKind(SyntaxKind.VariableDeclaration);

        for (const decl of variableDecls) {
            const initializer = decl.getInitializer();
            if (!initializer) continue;

            const isReqJson =
                Node.isCallExpression(initializer) &&
                initializer.getExpression().getText().includes("req.json");

            if (!isReqJson) continue;

            const destructuring = decl.getNameNode();
            if (Node.isObjectBindingPattern(destructuring)) {
                const hasUserId = destructuring.getElements().some(el => el.getName() === "userId");
                if (hasUserId) {
                    issues.push({ file: routePath, message: "禁止在 body 中传 userId（从 req.json 解构）" });
                }
            }
        }

        // -----------------------------
        // R8: import type { XxxDto, XxxResponseDto } from './entity'
        // -----------------------------
        const importDecls = source.getImportDeclarations();

        const entityImport = importDecls.find(imp => imp.getModuleSpecifierValue() === "./entity");

        if (!entityImport || !entityImport.isTypeOnly()) {
            issues.push({ file: routePath, message: "缺少 import type 引入 DTO 类型（必须来自 ./entity）" });
        } else {
            const names = entityImport.getNamedImports().map(n => n.getName());

            if (!names.includes(dtoName)) {
                issues.push({ file: routePath, message: `必须 import type { ${dtoName} } from './entity'` });
            }
            if (!names.includes(respDtoName)) {
                issues.push({ file: routePath, message: `必须 import type { ${respDtoName} } from './entity'` });
            }
        }

        // -----------------------------
        // R9: NextResponse.json<ApiData<ResponseDto>>
        // -----------------------------
        const jsonCalls = source
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(c => {
                const exp = c.getExpression();
                return Node.isPropertyAccessExpression(exp)
                    && exp.getExpression().getText() === "NextResponse"
                    && exp.getName() === "json";
            });

        let hasCorrectGeneric = false;

        for (const jsonCall of jsonCalls) {
            const typeArgs = jsonCall.getTypeArguments();
            if (typeArgs.length === 0) continue;

            const text = typeArgs[0].getText();

            if (new RegExp(`ApiData<.*${respDtoName}>`).test(text)) {
                hasCorrectGeneric = true;
                break;
            }
        }

        if (!hasCorrectGeneric) {
            issues.push({ file: routePath, message: `返回必须是 ApiData<${respDtoName}>` });
        }

        // ============================================================
        // R10: 新规则
        // 目录内必须有 entity.ts，并且必须声明 XxxDto / XxxResponseDto
        // ============================================================

        // -----------------------------
        // entity.ts 必须存在
        // -----------------------------
        if (!fs.existsSync(entityFilePath)) {
            issues.push({
                file: routePath,
                message: "缺少 entity.ts 文件（必须在 route.ts 同目录）"
            });
            continue; // entity 不存在后面规则无法检查
        }

        const entitySource = project.addSourceFileAtPath(entityFilePath);

        // -----------------------------
        // entity.ts 必须有 interface XxxDto
        // -----------------------------
        const entityInterfaces = entitySource.getInterfaces().map(i => i.getName());

        if (!entityInterfaces.includes(dtoName)) {
            issues.push({
                file: entityFilePath,
                message: `entity.ts 中缺少接口 ${dtoName}`
            });
        }

        if (!entityInterfaces.includes(respDtoName)) {
            issues.push({
                file: entityFilePath,
                message: `entity.ts 中缺少接口 ${respDtoName}`
            });
        }

        // -----------------------------
        // route.ts 中必须使用“as XxxDto”
        // -----------------------------
        const asExpressions = source.getDescendantsOfKind(SyntaxKind.AsExpression);

        const usedRequestDto = asExpressions.some(expr => {
            const t = expr.getTypeNode()?.getText();
            return t === dtoName;
        });

        if (!usedRequestDto) {
            issues.push({
                file: routePath,
                message: `req.json() 必须使用 "as ${dtoName}"`
            });
        }
    }

    return issues;
}
