import { describe, expect, it } from 'vitest';
import { HamiltonianCycle } from './hamiltonian';

describe('HamiltonianCycle', () => {
  it('should generate a valid cycle for 4x4 grid', () => {
    const width = 4;
    const height = 4;
    const hc = new HamiltonianCycle(width, height);
    
    // Check pathMap size
    expect(hc.pathMap.length).toBe(width * height);
    
    // Check cycle size
    expect(hc.cycle.length).toBe(width * height);
    
    // Check that every cell is visited exactly once
    const visited = new Set<string>();
    for (const p of hc.cycle) {
      const key = `${p.x},${p.y}`;
      expect(visited.has(key)).toBe(false);
      visited.add(key);
      // Check bounds
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(height);
    }
    expect(visited.size).toBe(width * height);
    
    // Check connectivity (each point is neighbor to next)
    for (let i = 0; i < hc.cycle.length; i++) {
      const curr = hc.cycle[i];
      const next = hc.cycle[(i + 1) % hc.cycle.length];
      const dist = Math.abs(curr.x - next.x) + Math.abs(curr.y - next.y);
      expect(dist).toBe(1);
    }
  });

  it('should calculate distance correctly on cycle', () => {
    const hc = new HamiltonianCycle(4, 4);
    // Cycle length is 16.
    // dist(0, 1) should be 1
    // dist(1, 0) should be 15
    // dist(0, 5) should be 5
    
    expect(hc.dist(0, 1)).toBe(1);
    expect(hc.dist(1, 0)).toBe(15);
    expect(hc.dist(0, 5)).toBe(5);
  });
});
