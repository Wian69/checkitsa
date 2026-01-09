const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Custom Cloudflare Build...');

// 1. Run npx vercel build
const vercel = spawn('npx.cmd', ['vercel', 'build', '--yes'], {
    shell: true,
    stdio: 'inherit'
});

vercel.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Vercel build failed.');
        process.exit(code);
    }

    console.log('✅ Vercel build complete. Converting to Cloudflare...');

    // 2. Run next-on-pages --skip-build
    const cf = spawn('npx.cmd', ['@cloudflare/next-on-pages', '--skip-build'], {
        shell: true,
        stdio: 'inherit'
    });

    cf.on('close', (cfCode) => {
        if (cfCode !== 0) {
            console.error('❌ Cloudflare conversion failed.');
        } else {
            console.log('✨ SUCCESS! Your build is ready in .vercel/output');
            console.log('Now run: npx wrangler pages deploy .vercel/output --branch=main --commit-dirty=true');
        }
        process.exit(cfCode);
    });
});
