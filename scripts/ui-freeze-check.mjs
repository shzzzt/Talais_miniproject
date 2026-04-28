#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'resources/js/Pages');
const FORBIDDEN = [
    /from\s+['"]react-router-dom['"]/,
    /from\s+['"]@base44\/sdk['"]/,
    /from\s+['"]@base44\/vite-plugin['"]/,
    /from\s+['"]@mui\//,
    /from\s+['"]@mantine\//,
    /from\s+['"]antd['"]/,
    /from\s+['"]@chakra-ui\//,
];

async function* walk(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
        if (err.code === 'ENOENT') return;
        throw err;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else if (/\.(jsx?|tsx?)$/.test(entry.name)) yield full;
    }
}

let bad = 0;
for await (const file of walk(ROOT)) {
    const text = await fs.readFile(file, 'utf8');
    for (const re of FORBIDDEN) {
        if (re.test(text)) {
            console.error(`ui-freeze: forbidden import ${re} in ${path.relative(process.cwd(), file)}`);
            bad++;
        }
    }
}

if (bad > 0) {
    console.error(`ui-freeze: ${bad} violation(s) found.`);
    process.exit(1);
}
console.log('ui-freeze: clean.');
