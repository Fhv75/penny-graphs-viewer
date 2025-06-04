// ===== HULL DETECTION MODULE =====

/**
 * Core algorithm to find which disks belong to the convex hull
 */
import GeometryUtils from './geometryUtils.js';

let HullDetection = {};

export default HullDetection = {
    /**
     * Find hull disks using directional sweeping method
     * 
     * ALGORITHM EXPLANATION:
     * - Cast rays in many directions from origin
     * - For each direction, find the disk that extends furthest
     * - A disk extends distance = center_projection + radius in that direction
     * - Collect all "extreme" disks found this way
     * 
     * WHY THIS WORKS:
     * - Any disk on the convex hull must be extreme in at least one direction
     * - Using many directions (360) ensures we don't miss any hull disks
     * - This is more robust than other methods for disk hulls
     */
    findHullDisks(disks, numDirections = 360) {
        if (disks.length <= 1) return disks.slice();
        
        const hullSet = new Set();
        
        // Sweep in all directions
        for (let i = 0; i < numDirections; i++) {
            const angle = (2 * Math.PI * i) / numDirections;
            const direction = { x: Math.cos(angle), y: Math.sin(angle) };
            
            let maxProjection = -Infinity;
            let extremeDisk = null;
            
            // Find disk that projects furthest in this direction
            for (const disk of disks) {
                // Key insight: disk's "reach" in direction = center projection + radius
                const projection = disk.x * direction.x + disk.y * direction.y + disk.r;
                
                if (projection > maxProjection) {
                    maxProjection = projection;
                    extremeDisk = disk;
                }
            }
            
            if (extremeDisk) {
                hullSet.add(extremeDisk);
            }
        }
        
        return Array.from(hullSet);
    },

    /**
     * Order hull disks for traversal (counterclockwise)
     */
    orderHullDisks(hullDisks) {
        if (hullDisks.length <= 2) return hullDisks;
        
        const center = GeometryUtils.centroid(hullDisks);
        return GeometryUtils.sortByPolarAngle(hullDisks, center);
    },

    /**
     * Complete hull detection pipeline
     */
    computeHull(disks) {
        const hullDisks = this.findHullDisks(disks);
        const orderedHull = this.orderHullDisks(hullDisks);
        const hullCenter = GeometryUtils.centroid(orderedHull);
        
        return {
            disks: orderedHull,
            center: hullCenter,
            isHullDisk: new Set(orderedHull) // For O(1) membership testing
        };
    }
};