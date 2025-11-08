import DiskConvexHull from './DiskConvexHull.js';
import GeometryUtils from './geometryUtils.js';

function example1() {
    const disks = [
        { x: -50, y: 50, r: 25 },
        { x: 50, y: 40, r: 25 },
        { x: 40, y: -50, r: 25 },
        { x: -40, y: -40, r: 25 }
    ];
    
    const hullComputer = new DiskConvexHull();
    const result = hullComputer.compute(disks);
    
    console.log('Hull disks:', result.hull.disks.length);
    console.log('Segments:', result.segments.length);
    
    return result;
}

function renderHullToCanvas(disks, canvas) {
    const ctx = canvas.getContext('2d');
    const hullComputer = new DiskConvexHull();
    const result = hullComputer.compute(disks);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const disk of disks) {
        ctx.beginPath();
        ctx.arc(disk.x, disk.y, disk.r, 0, 2 * Math.PI);
        ctx.strokeStyle = hullComputer.isHullDisk(disk) ? '#0066cc' : '#cccccc';
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    
    for (const segment of result.segments) {
        if (segment.type === 'tangent') {
            ctx.beginPath();
            ctx.moveTo(segment.from.x, segment.from.y);
            ctx.lineTo(segment.to.x, segment.to.y);
            ctx.stroke();
        } else if (segment.type === 'arc') {
            const disk = segment.disk;
            const startAngle = segment.startAngle;
            const endAngle = segment.endAngle;
            
            let angleDiff = GeometryUtils.normalizeAngle(endAngle - startAngle);
            let counterclockwise = angleDiff > 0;
            
            ctx.beginPath();
            ctx.arc(disk.x, disk.y, disk.r, startAngle, endAngle, counterclockwise);
            ctx.stroke();
        }
    }
}

function exportHullPath(disks) {
    const hullComputer = new DiskConvexHull();
    const result = hullComputer.compute(disks);
    
    const pathCommands = [];
    let currentPoint = null;
    
    for (const segment of result.segments) {
        if (segment.type === 'tangent') {
            if (!currentPoint || 
                Math.abs(currentPoint.x - segment.from.x) > 1e-6 || 
                Math.abs(currentPoint.y - segment.from.y) > 1e-6) {
                pathCommands.push(`M ${segment.from.x} ${segment.from.y}`);
            }
            pathCommands.push(`L ${segment.to.x} ${segment.to.y}`);
            currentPoint = segment.to;
        } else if (segment.type === 'arc') {
            const disk = segment.disk;
            const r = disk.r;
            const startPoint = segment.startPoint;
            const endPoint = segment.endPoint;
            
            const largeArcFlag = Math.abs(segment.endAngle - segment.startAngle) > Math.PI ? 1 : 0;
            const sweepFlag = 1; 
            
            pathCommands.push(`A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`);
            currentPoint = endPoint;
        }
    }
    
    return pathCommands.join(' ');
}

export {
    example1,
    renderHullToCanvas,
    exportHullPath
};