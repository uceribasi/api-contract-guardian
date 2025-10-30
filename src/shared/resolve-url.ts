import {
    Node,
    SyntaxKind,
    StringLiteralLike,
    TemplateExpression,
    TaggedTemplateExpression,
} from "ts-morph";

function resolveTemplateExpression(te: TemplateExpression): string {
    const head = te.getHead().getText().slice(1, -2); // ilk backtick ve ${ öncesi `
    let out = head;
    for (const span of te.getTemplateSpans()) {
        out += "{var}";
        const lit = span.getLiteral().getText(); // e.g. "}foo`" veya "}`"
        out += lit.slice(0, lit.length - 1); // sondaki backtick'i at
    }
    return out;
}

export function resolveStringFromNode(node: Node | undefined): string | null {
    if (!node) return null;

    if (node.isKind(SyntaxKind.ParenthesizedExpression)) {
        return resolveStringFromNode(node.getExpression());
    }
    if (node.isKind(SyntaxKind.AsExpression) || node.isKind(SyntaxKind.TypeAssertionExpression)) {
        return resolveStringFromNode(node.getExpression());
    }
    if (node.isKind(SyntaxKind.NonNullExpression)) {
        return resolveStringFromNode(node.getExpression());
    }
    if (node.isKind(SyntaxKind.SatisfiesExpression)) {
        return resolveStringFromNode(node.getExpression());
    }

    if (node.isKind(SyntaxKind.StringLiteral) || node.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        return (node as StringLiteralLike).getLiteralValue();
    }

    if (node.isKind(SyntaxKind.TemplateExpression)) {
        return resolveTemplateExpression(node);
    }

    if (node.isKind(SyntaxKind.TaggedTemplateExpression)) {
        const tt = node as TaggedTemplateExpression;
        const tpl = tt.getTemplate();
        if (tpl.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
            return tpl.getLiteralValue();
        }
        if (tpl.isKind(SyntaxKind.TemplateExpression)) {
            return resolveTemplateExpression(tpl);
        }
        return null;
    }

    if (node.isKind(SyntaxKind.BinaryExpression)) {
        const left = resolveStringFromNode(node.getLeft());
        const right = resolveStringFromNode(node.getRight());
        if (left === null || right === null) return null;
        return left + right;
    }

    if (node.isKind(SyntaxKind.Identifier)) {
        const symbol = node.getSymbol();
        const decl = symbol?.getDeclarations()?.[0] as any;
        const init = decl?.getInitializer?.();
        if (init) return resolveStringFromNode(init);
        return null;
    }

    if (node.isKind(SyntaxKind.CallExpression)) {
        const args = node.getArguments();
        if (args.length >= 2) {
            const a = resolveStringFromNode(args[0]);
            const b = resolveStringFromNode(args[1]);
            if (a && b) {
                if (a.endsWith("/") && b.startsWith("/")) return a + b.slice(1);
                if (!a.endsWith("/") && !b.startsWith("/")) return a + "/" + b;
                return a + b;
            }
        }
        return resolveStringFromNode(args[0]);
    }

    return null;
}
