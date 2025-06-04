// ===== CORE GEOMETRIC UTILITIES =====


/**
 * Basic geometric utilities used throughout the algorithm
 */
let GeometryUtils = {}
export default GeometryUtils = {
    /**
     * Calculate Euclidean distance between two points
     */
    distance(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    },

    /**
     * Normalize angle to [-π, π] range
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle <= -Math.PI) angle += 2 * Math.PI;
        return angle;
    },

    /**
     * Calculate centroid of a set of points
     */
    centroid(points) {
        let cx = 0, cy = 0;
        for (const p of points) {
            cx += p.x;
            cy += p.y;
        }
        return { x: cx / points.length, y: cy / points.length };
    },

    /**
     * Sort points by polar angle relative to a center point
     */
    sortByPolarAngle(points, center) {
        return points.slice().sort((a, b) => {
            const angleA = Math.atan2(a.y - center.y, a.x - center.x);
            const angleB = Math.atan2(b.y - center.y, b.x - center.x);
            return angleA - angleB;
        });
    }
};
