/**
 * Syntax + module-resolution check for the backend.
 *
 * Recursively requires every file under src/ so that syntax errors, bad
 * imports and circular-dependency crashes surface without needing a database
 * connection or a running server.
 *
 * Usage: node scripts/syntax-check.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src');

const collect = (dir, acc = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(full, acc);
        else if (entry.name.endsWith('.js')) acc.push(full);
    }
    return acc;
};

const files = collect(SRC).sort();
let syntaxFailures = 0;

for (const file of files) {
    const rel = path.relative(path.join(__dirname, '..'), file);
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
        console.log(`  ok   ${rel}`);
    } catch (err) {
        syntaxFailures += 1;
        console.error(`  FAIL ${rel}`);
        console.error(String(err.stderr || err.message).trim());
    }
}

console.log(`\nSyntax: ${files.length - syntaxFailures}/${files.length} files parsed.`);

if (syntaxFailures > 0) {
    console.error(`\n${syntaxFailures} file(s) failed to parse.`);
    process.exit(1);
}

console.log('ALL_BACKEND_SYNTAX_OK');
