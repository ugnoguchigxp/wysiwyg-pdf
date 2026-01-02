import worker from './worker';

describe('Worker', () => {
    it('should load without error', () => {
        expect(worker).toBeDefined();
    });
});
