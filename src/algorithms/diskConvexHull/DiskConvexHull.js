// ===== MAIN API =====

/**
 * Main API for disk convex hull computation
 */
import HullDetection from './hullDetection.js';
import HullGeometry from './hullGeometry.js';

export default class DiskConvexHull {
    constructor() {
        this.hull = null;
        this.segments = null;
    }
    
    /**
     * Compute convex hull for given disks
     * @param {Array} disks - Array of {x, y, r} objects
     * @returns {Object} Hull data structure
     */
    compute(disks) {
        // Step 1: Find and order hull disks
        this.hull = HullDetection.computeHull(disks);
        
        // Step 2: Compute geometric segments
        this.segments = HullGeometry.computeHullSegments(this.hull);
        
        return {
            hull: this.hull,
            segments: this.segments
        };
    }
    
    /**
     * Check if a disk is on the hull boundary
     */
    isHullDisk(disk) {
        return this.hull ? this.hull.isHullDisk.has(disk) : false;
    }
    
    /**
     * Get hull statistics
     */
    getStats() {
        if (!this.hull) return null;
        
        return {
            totalDisks: this.hull.disks.length,
            hullDisks: this.hull.disks.length,
            tangentSegments: this.segments ? this.segments.filter(s => s.type === 'tangent').length : 0,
            arcSegments: this.segments ? this.segments.filter(s => s.type === 'arc').length : 0
        };
    }
}