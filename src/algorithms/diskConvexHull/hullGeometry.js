import TangentComputation from './tangentComputation.js';

let HullGeometry = {};

export default HullGeometry = {
    computeHullSegments(hull) {
        const segments = [];
        
        if (hull.disks.length < 2) return segments;
        
        for (let i = 0; i < hull.disks.length; i++) {
            const curr = hull.disks[i];
            const next = hull.disks[(i + 1) % hull.disks.length];
            
            const tangents = TangentComputation.externalTangentsEqualRadius(curr, next);
            const selectedTangent = TangentComputation.selectHullTangent(
                curr, next, tangents, hull.center
            );
            
            if (selectedTangent) {
                segments.push({
                    type: 'tangent',
                    from: selectedTangent.p1,
                    to: selectedTangent.p2,
                    disk1: curr,
                    disk2: next
                });
            }
        }
        
        for (let i = 0; i < hull.disks.length; i++) {
            const curr = hull.disks[i];
            const prev = hull.disks[(i - 1 + hull.disks.length) % hull.disks.length];
            const next = hull.disks[(i + 1) % hull.disks.length];
            
            const prevTangents = TangentComputation.externalTangentsEqualRadius(prev, curr);
            const nextTangents = TangentComputation.externalTangentsEqualRadius(curr, next);
            
            const prevTangent = TangentComputation.selectHullTangent(prev, curr, prevTangents, hull.center);
            const nextTangent = TangentComputation.selectHullTangent(curr, next, nextTangents, hull.center);
            
            if (prevTangent && nextTangent) {
                const startAngle = Math.atan2(prevTangent.p2.y - curr.y, prevTangent.p2.x - curr.x);
                const endAngle = Math.atan2(nextTangent.p1.y - curr.y, nextTangent.p1.x - curr.x);
                
                segments.push({
                    type: 'arc',
                    disk: curr,
                    startAngle: startAngle,
                    endAngle: endAngle,
                    startPoint: prevTangent.p2,
                    endPoint: nextTangent.p1
                });
            }
        }
        
        return segments;
    }
};