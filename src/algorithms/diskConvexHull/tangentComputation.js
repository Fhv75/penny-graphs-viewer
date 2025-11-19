import GeometryUtils from './geometryUtils.js';

let TangentComputation = {};

export default TangentComputation = {
    externalTangentsEqualRadius(disk1, disk2) {
        const dx = disk2.x - disk1.x;
        const dy = disk2.y - disk1.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 1e-10) {
            return null;
        }
        
        const baseAngle = Math.atan2(dy, dx);
        
        const perpAngle1 = baseAngle + Math.PI/2;
        const perpAngle2 = baseAngle - Math.PI/2;
        
        return [
            {
                p1: { 
                    x: disk1.x + disk1.r * Math.cos(perpAngle1), 
                    y: disk1.y + disk1.r * Math.sin(perpAngle1) 
                },
                p2: { 
                    x: disk2.x + disk2.r * Math.cos(perpAngle1), 
                    y: disk2.y + disk2.r * Math.sin(perpAngle1) 
                }
            },
            {
                p1: { 
                    x: disk1.x + disk1.r * Math.cos(perpAngle2), 
                    y: disk1.y + disk1.r * Math.sin(perpAngle2) 
                },
                p2: { 
                    x: disk2.x + disk2.r * Math.cos(perpAngle2), 
                    y: disk2.y + disk2.r * Math.sin(perpAngle2) 
                }
            }
        ];
    },

    selectHullTangent(disk1, disk2, tangents, hullCenter) {
        if (!tangents || tangents.length === 0) return null;
        if (tangents.length === 1) return tangents[0];
        
        let bestTangent = tangents[0];
        let maxDistance = -Infinity;
        
        for (const tangent of tangents) {
            const midPoint = {
                x: (tangent.p1.x + tangent.p2.x) / 2,
                y: (tangent.p1.y + tangent.p2.y) / 2
            };
            
            const distance = GeometryUtils.distance(midPoint, hullCenter);
            if (distance > maxDistance) {
                maxDistance = distance;
                bestTangent = tangent;
            }
        }
        
        return bestTangent;
    }
};