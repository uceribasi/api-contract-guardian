import { SyntaxKind, Node, ObjectLiteralExpression } from "ts-morph";
import { resolveStringFromNode } from "../../shared/resolve-url";

export const parseObjectLiteral = (objectNode: ObjectLiteralExpression): object => {
    const obj: Record<string, any> = {};
    for (const prop of objectNode.getProperties()) {
        if (prop.isKind(SyntaxKind.PropertyAssignment)) {
            const key = prop.getName();
            const valueNode = prop.getInitializer();
            obj[key] = parseNodeValue(valueNode);
        }
    }
    return obj;
};

export const parseNodeValue = (valueNode: Node | undefined): any => {
    if (!valueNode) return undefined;
    if (valueNode.isKind(SyntaxKind.StringLiteral)) return valueNode.getLiteralValue();
    if (valueNode.isKind(SyntaxKind.NumericLiteral)) return valueNode.getLiteralValue();
    if (valueNode.isKind(SyntaxKind.TrueKeyword)) return true;
    if (valueNode.isKind(SyntaxKind.FalseKeyword)) return false;

    if (valueNode.isKind(SyntaxKind.ArrayLiteralExpression)) {
        return valueNode.getElements().map(parseNodeValue);
    }
    if (valueNode.isKind(SyntaxKind.ObjectLiteralExpression)) {
        return parseObjectLiteral(valueNode);
    }
    if (valueNode.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        return valueNode.getLiteralValue();
    }
    if (valueNode.isKind(SyntaxKind.TemplateExpression)) {
        const raw = valueNode.getText();
        return raw.slice(1, -1).replace(/\$\{[^}]+\}/g, "{var}");
    }
    if (valueNode.isKind(SyntaxKind.Identifier)) {
        // Değerini okuyabilen üst katman bunu çözebilsin diye işaret bırakmak yerine null döndürmeyelim:
        const resolved = resolveStringFromNode(valueNode);
        return resolved ?? `{Variable: ${valueNode.getText()}}`;
    }
    return `{Unsupported: ${valueNode.getKindName()}}`;
};

export const parseUrlArgument = (node: Node | undefined): string | null => {
    return resolveStringFromNode(node);
};
