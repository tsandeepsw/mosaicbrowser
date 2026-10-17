import { describe, it, expect } from 'vitest';
import { getLayoutPreset } from './LayoutEngine';

describe('LayoutEngine', () => {
  it('should calculate 1-panel layout', () => {
    const layout = getLayoutPreset('1', 1);
    expect(layout.length).toBe(1);
    expect(layout[0]).toEqual({ i: 'placeholder-0', x: 0, y: 0, w: 12, h: 6 });
  });

  it('should calculate 2x2 grid layout', () => {
    const layout = getLayoutPreset('2x2', 4);
    expect(layout.length).toBe(4);
    expect(layout[0]).toEqual({ i: 'placeholder-0', x: 0, y: 0, w: 6, h: 6 });
    expect(layout[1]).toEqual({ i: 'placeholder-1', x: 6, y: 0, w: 6, h: 6 });
    expect(layout[2]).toEqual({ i: 'placeholder-2', x: 0, y: 6, w: 6, h: 6 });
    expect(layout[3]).toEqual({ i: 'placeholder-3', x: 6, y: 6, w: 6, h: 6 });
  });

  it('should calculate 3x2 grid layout', () => {
    const layout = getLayoutPreset('3x2', 3);
    expect(layout.length).toBe(3);
    expect(layout[0]).toEqual({ i: 'placeholder-0', x: 0, y: 0, w: 4, h: 6 });
    expect(layout[1]).toEqual({ i: 'placeholder-1', x: 4, y: 0, w: 4, h: 6 });
    expect(layout[2]).toEqual({ i: 'placeholder-2', x: 8, y: 0, w: 4, h: 6 });
  });

  it('should calculate 4x2 grid layout', () => {
    const layout = getLayoutPreset('4x2', 4);
    expect(layout.length).toBe(4);
    expect(layout[0]).toEqual({ i: 'placeholder-0', x: 0, y: 0, w: 3, h: 6 });
    expect(layout[1]).toEqual({ i: 'placeholder-1', x: 3, y: 0, w: 3, h: 6 });
    expect(layout[2]).toEqual({ i: 'placeholder-2', x: 6, y: 0, w: 3, h: 6 });
    expect(layout[3]).toEqual({ i: 'placeholder-3', x: 9, y: 0, w: 3, h: 6 });
  });

  it('should calculate 4x4 grid layout', () => {
    const layout = getLayoutPreset('4x4', 4);
    expect(layout.length).toBe(4);
    expect(layout[0]).toEqual({ i: 'placeholder-0', x: 0, y: 0, w: 6, h: 3 });
    expect(layout[1]).toEqual({ i: 'placeholder-1', x: 6, y: 0, w: 6, h: 3 });
    expect(layout[2]).toEqual({ i: 'placeholder-2', x: 0, y: 6, w: 6, h: 3 });
    expect(layout[3]).toEqual({ i: 'placeholder-3', x: 6, y: 6, w: 6, h: 3 });
  });

  it('should merge with existing custom layout', () => {
    const custom = {
      'p1': { x: 1, y: 1, w: 5, h: 5 }
    };
    const layout = getLayoutPreset('custom', 1, custom);
    expect(layout.length).toBe(1);
    expect(layout[0]).toEqual({ i: 'p1', x: 1, y: 1, w: 5, h: 5 });
  });
});
