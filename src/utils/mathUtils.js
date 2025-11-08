export function marcarGrados(expr) {
    return expr.replace(
        /\b(sin|cos|tan|asin|acos|atan)\s*\(\s*([^\)]+?)\s*\)/g,
        (match, fnName, inner) => {
            const trimmed = inner.trim();
            if (/\b(deg|rad)$/.test(trimmed)) {
            return `${fnName}(${trimmed})`;
            }
            return `${fnName}(${trimmed} deg)`;
        }
    );
}

export function calculatePerimeter(segments, nodeSize) {
    let total = 0;
    for (const seg of segments) {
        if (seg.type === 'tangent') {
            const dx = seg.to.x - seg.from.x;
            const dy = seg.to.y - seg.from.y;
            total += Math.hypot(dx, dy);
        } else if (seg.type === 'arc') {
            let diff = seg.endAngle - seg.startAngle;
            if (diff < 0) diff += 2 * Math.PI;
            total += seg.disk.r * diff;
        }
    }
    return total * (1 / nodeSize);
}
