// ===== HULL GEOMETRY MODULE =====

/**
 * Computes the complete geometric representation of the hull
 */

import TangentComputation from './tangentComputation.js';

let HullGeometry = {};

export default HullGeometry = {
    /**
     * Compute all hull segments (tangent lines + circular arcs)
     * 
     * ALGORITHM EXPLANATION:
     * - For each consecutive pair of hull disks, find external tangent
     * - For each hull disk, find the arc between its two tangent points
     * - Arc goes from where previous tangent touches to where next tangent touches
     * - Direction of arc is chosen to stay on the hull boundary (external)
     */
    computeHullSegments(hull) {
        const segments = [];
        
        if (hull.disks.length < 2) return segments;
        
        // Compute tangent segments
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
        
        // Compute circular arcs
        for (let i = 0; i < hull.disks.length; i++) {
            const curr = hull.disks[i];
            const prev = hull.disks[(i - 1 + hull.disks.length) % hull.disks.length];
            const next = hull.disks[(i + 1) % hull.disks.length];
            
            // Find tangent points on current disk
            const prevTangents = TangentComputation.externalTangentsEqualRadius(prev, curr);
            const nextTangents = TangentComputation.externalTangentsEqualRadius(curr, next);
            
            const prevTangent = TangentComputation.selectHullTangent(prev, curr, prevTangents, hull.center);
            const nextTangent = TangentComputation.selectHullTangent(curr, next, nextTangents, hull.center);
            
            if (prevTangent && nextTangent) {
                // Arc goes from prevTangent.p2 to nextTangent.p1 on disk curr
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