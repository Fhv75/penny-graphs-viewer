import HullDetection from './hullDetection.js';
import HullGeometry from './hullGeometry.js';

export default class DiskConvexHull {
    constructor() {
        this.hull = null;
        this.segments = null;
    }
    
    compute(disks) {
        this.hull = HullDetection.computeHull(disks);
        
        this.segments = HullGeometry.computeHullSegments(this.hull);
        
        return {
            hull: this.hull,
            segments: this.segments
        };
    }
    
    isHullDisk(disk) {
        return this.hull ? this.hull.isHullDisk.has(disk) : false;
    }
    
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