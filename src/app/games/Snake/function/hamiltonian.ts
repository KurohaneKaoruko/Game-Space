import type { Point } from '../types';

const toIdx = (x: number, y: number, width: number) => y * width + x;

export class HamiltonianCycle {
  width: number;
  height: number;
  // pathMap stores the order/index of each cell in the cycle (0 to N-1)
  pathMap: Int16Array;
  // cycle stores the coordinates at each index
  cycle: Point[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pathMap = new Int16Array(width * height).fill(-1);
    this.cycle = new Array(width * height);
    this.generate();
  }

  // Get distance between two points on the cycle (a -> b)
  dist(aIdx: number, bIdx: number): number {
    if (aIdx === -1 || bIdx === -1) return Infinity;
    const len = this.width * this.height;
    return (bIdx - aIdx + len) % len;
  }

  getCycleIndex(p: Point): number {
    if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height) return -1;
    return this.pathMap[toIdx(p.x, p.y, this.width)];
  }

  private record(x: number, y: number, idx: number) {
    this.pathMap[toIdx(x, y, this.width)] = idx;
    this.cycle[idx] = { x, y };
  }

  private generate() {
    // Generates a simple serpentine Hamiltonian cycle for even-width grids.
    // Pattern:
    // 1. Column 0: Go Down (0,0 -> 0,H-1)
    // 2. Columns 1..W-1: Serpentine
    //    - Col 1: Up (1,H-1 -> 1,1) -> leave (1,0) for return
    //    - Col 2: Down (2,1 -> 2,H-1)
    //    - ...
    //    - Col W-1: Up (W-1,H-1 -> W-1,0)
    //    - Row 0: Left (W-1,0 -> ... -> 1,0 -> 0,0)
    
    // Note: This pattern requires Width to be even.
    // If Width is odd but Height is even, we could transpose, but for simplicity
    // we assume the game settings allow even sizes (16, 20, 24).
    
    const w = this.width;
    const h = this.height;
    let idx = 0;

    // 1. First Column: Down from (0,1) to (0, H-1)
    // (0,0) is usually the end of the return path, or start. 
    // Let's make (0,0) index 0.
    
    // Actually, let's trace carefully to close the loop.
    // 0: (0,0)
    // 1: (1,0) -> ... -> (W-1, 0)  (Top row Right)
    // Then snake down?
    // Let's try the "standard" U-turn pattern for even Width.
    // (0,0) -> (1,0) -> ... -> (W-1, 0)
    // (W-1, 1) -> (W-2, 1) -> ... -> (1, 1)
    // (1, 2) -> (2, 2) -> ... -> (W-1, 2)
    // ...
    // This leaves Column 0 unused except (0,0).
    // Finally Column 0 goes Up: (0, H-1) -> ... -> (0, 1) -> (0,0).
    // This works if we can enter (0, H-1) from the last row.
    
    // Let's stick to the column-based one I thought of first, it handles W even nicely.
    // Start at (0,0).
    // Col 0: Down. (0,0) -> (0,1) -> ... -> (0, H-1).
    // Col 1: Right. (1, H-1).
    // Col 1: Up. (1, H-1) -> ... -> (1, 1). (Stop at 1)
    // Col 2: Right. (2, 1).
    // Col 2: Down. (2, 1) -> ... -> (2, H-1).
    // ...
    // Repeat pair of columns (Up then Down).
    // Last Column (W-1). Since W is even, pairs are (1,2), (3,4)... (W-1) is odd index col.
    // Wait. Col 0 is separate.
    // Remaining cols: 1 to W-1. Count is W-1 (Odd).
    // This means we can't pair them up perfectly if we want to end at Top.
    // Col 1: Up. Col 2: Down. Col 3: Up. ... Col W-1: Up.
    // So Col W-1 ends at (W-1, 1).
    // Then we have the top row (y=0) free from x=W-1 down to x=1.
    // Then (1,0) -> (0,0). Closed!
    
    // Implementation:
    
    // 1. Col 0: Down (0,0 to 0,H-1)
    for (let y = 0; y < h; y++) {
        this.record(0, y, idx++);
    }
    
    // 2. Snake through Cols 1 to W-1
    for (let x = 1; x < w; x++) {
        if (x % 2 === 1) {
            // Odd columns (1, 3...): Up from H-1 to 1
            for (let y = h - 1; y >= 1; y--) {
                this.record(x, y, idx++);
            }
        } else {
            // Even columns (2, 4...): Down from 1 to H-1
            for (let y = 1; y < h; y++) {
                this.record(x, y, idx++);
            }
        }
    }
    
    // 3. Return path: Top row (y=0) from W-1 to 1
    // The last column (W-1) is Odd (since W is even), so it went Up to y=1.
    // So we are at (W-1, 1).
    // Wait, the loop above for Odd x ends at y=1.
    // So we are at (x, 1).
    // We need to move to (x, 0).
    
    // Correction:
    // The loop structure above connects (x, y) to (x, y+/-1).
    // Connections betweeen columns?
    // Col 0 ends at (0, H-1).
    // Col 1 starts at (1, H-1). (Right move).
    // Col 1 ends at (1, 1).
    // Col 2 starts at (2, 1). (Right move).
    // Col 2 ends at (2, H-1).
    // Col 3 starts at (3, H-1).
    // ...
    // Col W-1 (Odd) ends at (W-1, 1).
    // From there, we go Up to (W-1, 0).
    // Then Left to (0,0).
    
    // Add top row return path
    for (let x = w - 1; x > 0; x--) {
        this.record(x, 0, idx++);
    }
    
    // Verify closure: Last point recorded is (1,0). Next should be (0,0) which is index 0.
    // Perfect.
  }
}
