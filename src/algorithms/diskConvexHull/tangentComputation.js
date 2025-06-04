// ===== TANGENT COMPUTATION MODULE =====

/**
 * Handles computation of external tangents between disks
 */

import GeometryUtils from './geometryUtils.js';

let TangentComputation = {};

export default TangentComputation = {
    /**
     * Compute external tangents between two disks of equal radius
     * 
     * ALGORITHM EXPLANATION:
     * - For equal radius disks, external tangents are always parallel
     * - Direction vector between centers gives us the base direction
     * - Tangents are perpendicular to this direction
     * - Two tangents: one above, one below the line connecting centers
     */
    externalTangentsEqualRadius(disk1, disk2) {
        const dx = disk2.x - disk1.x;
        const dy = disk2.y - disk1.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 1e-10) {
            return null; // Disks are coincident
        }
        
        // Base angle between disk centers
        const baseAngle = Math.atan2(dy, dx);
        
        // Two perpendicular directions
        const perpAngle1 = baseAngle + Math.PI/2;
        const perpAngle2 = baseAngle - Math.PI/2;
        
        return [
            {
                // "Upper" tangent
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
                // "Lower" tangent
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

    /**
     * Select the external tangent for the convex hull
     * 
     * SELECTION CRITERIA:
     * - Choose the tangent that's further from the hull center
     * - This ensures we get the "outer" tangent that forms the hull boundary
     */
    selectHullTangent(disk1, disk2, tangents, hullCenter) {
        if (!tangents || tangents.length === 0) return null;
        if (tangents.length === 1) return tangents[0];
        
        let bestTangent = tangents[0];
        let maxDistance = -Infinity;
        
        for (const tangent of tangents) {
            // Use midpoint of tangent line for distance calculation
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