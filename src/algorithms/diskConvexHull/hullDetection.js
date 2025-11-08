import GeometryUtils from './geometryUtils.js';

let HullDetection = {};

export default HullDetection = {
    findHullDisks(disks, numDirections = 360) {
        if (disks.length <= 1) return disks.slice();
        
        const hullSet = new Set();
        
        for (let i = 0; i < numDirections; i++) {
            const angle = (2 * Math.PI * i) / numDirections;
            const direction = { x: Math.cos(angle), y: Math.sin(angle) };
            
            let maxProjection = -Infinity;
            let extremeDisk = null;
            
            for (const disk of disks) {
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

    orderHullDisks(hullDisks) {
        if (hullDisks.length <= 2) return hullDisks;
        
        const center = GeometryUtils.centroid(hullDisks);
        return GeometryUtils.sortByPolarAngle(hullDisks, center);
    },

    computeHull(disks) {
        const hullDisks = this.findHullDisks(disks);
        const orderedHull = this.orderHullDisks(hullDisks);
        const hullCenter = GeometryUtils.centroid(orderedHull);
        
        return {
            disks: orderedHull,
            center: hullCenter,
            isHullDisk: new Set(orderedHull) 
        };
    }
};