const fs = require('fs');
try {
    const content = fs.readFileSync('ouycwnsb_db.sql', 'utf8');
    const tableMatches = content.matchAll(/INSERT INTO `?(\w+)`?/g);
    const tables = new Set();
    for (const match of tableMatches) {
        tables.add(match[1]);
    }
    console.log('Tables found:', Array.from(tables));
    console.log('File size:', content.length);
} catch (err) {
    console.error('Error reading file:', err.message);
}
