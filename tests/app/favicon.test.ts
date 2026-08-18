import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(__dirname, '..', '..');
const faviconPath = resolve(projectRoot, 'public/favicon.ico');
const layoutPath = resolve(projectRoot, 'src/app/layout.tsx');

describe('browser branding', () => {
  it('configures a multi-resolution favicon at the public browser icon path', () => {
    expect(existsSync(faviconPath)).toBe(true);

    const favicon = readFileSync(faviconPath);
    const layout = readFileSync(layoutPath, 'utf8');

    expect(favicon.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))).toBe(true);
    expect(favicon.readUInt16LE(4)).toBeGreaterThanOrEqual(5);
    expect(layout).toContain("url: '/favicon.ico'");
    expect(layout).toContain("type: 'image/x-icon'");
  });
});
