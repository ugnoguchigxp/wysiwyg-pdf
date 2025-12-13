import { simplifyPoints } from '../../../src/utils/geometry';

test('simplifyPoints reduces points on a straight line', () => {
    // A straight line with intermediate points: (0,0) -> (10,0) -> (20,0) ... -> (100,0)
    // Tolerance 1.0 should remove all intermediate points
    const points: number[] = [];
    for (let i = 0; i <= 100; i += 10) {
        points.push(i, 0);
    }

    const simplified = simplifyPoints(points, 1.0);

    // Should only have (0,0) and (100,0)
    expect(simplified.length).toBe(4);
    expect(simplified[0]).toBe(0);
    expect(simplified[1]).toBe(0);
    expect(simplified[2]).toBe(100);
    expect(simplified[3]).toBe(0);
});

test('simplifyPoints preserves a sharp corner', () => {
    // A "V" shape
    // (0,0) -> (50, 50) -> (100, 0)
    // With some intermediate noise points on the legs
    const points = [
        0, 0,
        10, 10,
        20, 20,
        50, 50, // Peak
        60, 40,
        100, 0
    ];

    const simplified = simplifyPoints(points, 2.0); // Tolerance 2

    // Should keep start(0,0), peak(50,50), end(100,0)
    // Length should be 6 numbers (3 points)
    expect(simplified.length).toBe(6);
    expect(simplified[2]).toBe(50);
    expect(simplified[3]).toBe(50);
});

test('simplifyPoints handles short lines gracefully', () => {
    const points = [0, 0, 10, 10];
    const simplified = simplifyPoints(points, 1.0);
    expect(simplified).toEqual(points);
});
