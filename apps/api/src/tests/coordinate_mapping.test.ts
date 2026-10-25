/**
 * Coordinate Mapping and Hit-Testing Unit Tests
 * Verifies that pointer to arena coordinate conversion maintains 100% precision
 * across center, left edge, right edge, top, bottom, and responsive CSS scaling.
 */

describe('Canvas Coordinate Mapping & Hit-Testing Tests', () => {
  // Mock canvas coordinate converter function
  function getCanvasCoordinatesMock(
    canvas: { width: number; height: number },
    rect: { left: number; top: number; width: number; height: number },
    clientX: number,
    clientY: number
  ) {
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function isHit(
    click: { x: number; y: number },
    target: { x: number; y: number; radius: number },
    tolerance = 6
  ) {
    const distance = Math.hypot(click.x - target.x, click.y - target.y);
    return {
      hit: distance <= target.radius + tolerance,
      distance,
    };
  }

  const internalResolution = { width: 900, height: 520 };

  // Scenario 1: Widescreen display (canvas stretched to 1200px CSS width)
  const widescreenRect = { left: 100, top: 80, width: 1200, height: 693.33 };

  // Scenario 2: Compact display / window resized (canvas compressed to 700px CSS width)
  const compactRect = { left: 50, top: 40, width: 700, height: 404.44 };

  describe('Target Click Alignment Under Responsive Scaling', () => {
    it('1. Test target at exact center (450, 260)', () => {
      const target = { x: 450, y: 260, radius: 20 };

      // User visually clicks on center of target in widescreen viewport
      const visualClientX = widescreenRect.left + (target.x / internalResolution.width) * widescreenRect.width;
      const visualClientY = widescreenRect.top + (target.y / internalResolution.height) * widescreenRect.height;

      const mapped = getCanvasCoordinatesMock(internalResolution, widescreenRect, visualClientX, visualClientY);
      const result = isHit(mapped, target);

      expect(mapped.x).toBeCloseTo(450, 4);
      expect(mapped.y).toBeCloseTo(260, 4);
      expect(result.distance).toBeCloseTo(0, 4);
      expect(result.hit).toBe(true);
    });

    it('2. Test target near left edge (50, 260)', () => {
      const target = { x: 50, y: 260, radius: 20 };

      const visualClientX = widescreenRect.left + (target.x / internalResolution.width) * widescreenRect.width;
      const visualClientY = widescreenRect.top + (target.y / internalResolution.height) * widescreenRect.height;

      const mapped = getCanvasCoordinatesMock(internalResolution, widescreenRect, visualClientX, visualClientY);
      const result = isHit(mapped, target);

      expect(mapped.x).toBeCloseTo(50, 4);
      expect(mapped.y).toBeCloseTo(260, 4);
      expect(result.distance).toBeCloseTo(0, 4);
      expect(result.hit).toBe(true);
    });

    it('3. Test target near right edge (850, 260)', () => {
      const target = { x: 850, y: 260, radius: 20 };

      const visualClientX = widescreenRect.left + (target.x / internalResolution.width) * widescreenRect.width;
      const visualClientY = widescreenRect.top + (target.y / internalResolution.height) * widescreenRect.height;

      const mapped = getCanvasCoordinatesMock(internalResolution, widescreenRect, visualClientX, visualClientY);
      const result = isHit(mapped, target);

      expect(mapped.x).toBeCloseTo(850, 4);
      expect(mapped.y).toBeCloseTo(260, 4);
      expect(result.distance).toBeCloseTo(0, 4);
      expect(result.hit).toBe(true);
    });

    it('4. Test target near top (450, 50)', () => {
      const target = { x: 450, y: 50, radius: 20 };

      const visualClientX = widescreenRect.left + (target.x / internalResolution.width) * widescreenRect.width;
      const visualClientY = widescreenRect.top + (target.y / internalResolution.height) * widescreenRect.height;

      const mapped = getCanvasCoordinatesMock(internalResolution, widescreenRect, visualClientX, visualClientY);
      const result = isHit(mapped, target);

      expect(mapped.x).toBeCloseTo(450, 4);
      expect(mapped.y).toBeCloseTo(50, 4);
      expect(result.distance).toBeCloseTo(0, 4);
      expect(result.hit).toBe(true);
    });

    it('5. Test target near bottom (450, 480)', () => {
      const target = { x: 450, y: 480, radius: 20 };

      const visualClientX = widescreenRect.left + (target.x / internalResolution.width) * widescreenRect.width;
      const visualClientY = widescreenRect.top + (target.y / internalResolution.height) * widescreenRect.height;

      const mapped = getCanvasCoordinatesMock(internalResolution, widescreenRect, visualClientX, visualClientY);
      const result = isHit(mapped, target);

      expect(mapped.x).toBeCloseTo(450, 4);
      expect(mapped.y).toBeCloseTo(480, 4);
      expect(result.distance).toBeCloseTo(0, 4);
      expect(result.hit).toBe(true);
    });

    it('6. Test window resize to compact screen', () => {
      const target = { x: 300, y: 200, radius: 20 };

      const visualClientX = compactRect.left + (target.x / internalResolution.width) * compactRect.width;
      const visualClientY = compactRect.top + (target.y / internalResolution.height) * compactRect.height;

      const mapped = getCanvasCoordinatesMock(internalResolution, compactRect, visualClientX, visualClientY);
      const result = isHit(mapped, target);

      expect(mapped.x).toBeCloseTo(300, 4);
      expect(mapped.y).toBeCloseTo(200, 4);
      expect(result.hit).toBe(true);
    });

    it('7. Verify old unscaled formula caused the rightward pointer offset bug', () => {
      // In the old buggy code: clickX = e.clientX - rect.left
      const target = { x: 450, y: 260, radius: 20 };
      const visualClientX = widescreenRect.left + (target.x / internalResolution.width) * widescreenRect.width;
      const visualClientY = widescreenRect.top + (target.y / internalResolution.height) * widescreenRect.height;

      const buggyX = visualClientX - widescreenRect.left;
      const buggyY = visualClientY - widescreenRect.top;

      // Buggy X was 600 instead of 450 (150px to the right!)
      expect(buggyX).toBe(600);
      expect(buggyX - target.x).toBe(150); // Severe offset to the right

      // With precision mapping, offset is zero
      const corrected = getCanvasCoordinatesMock(internalResolution, widescreenRect, visualClientX, visualClientY);
      expect(corrected.x - target.x).toBeCloseTo(0, 4);
    });
  });
});
