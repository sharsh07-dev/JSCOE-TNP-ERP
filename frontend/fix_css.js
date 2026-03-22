const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css = css.replace(/\.card\s*\{([\s\S]*?)\}\s*\.card:hover\s*\{([\s\S]*?)\}/, (match, cardProps, hoverProps) => {
    // Merge hover props logically if possible, but simpler to just provide a clean utility
    return `@utility card {
  ${cardProps.trim()}
}
@utility hover-card-glow {
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.08);
}`;
});

const utils = ['btn-primary', 'btn-secondary', 'btn-danger', 'input-field', 'input-label', 'badge', 'badge-blue', 'badge-green', 'badge-purple', 'badge-yellow', 'badge-red', 'stat-card', 'sidebar-item', 'page-title', 'section-title', 'glass-card'];

for (const u of utils) {
    const rx = new RegExp(`\\.${u}\\s*\\{`, 'g');
    css = css.replace(rx, `@utility ${u} {`);
}

css = css.replace(/\.sidebar-item\.active\s*\{[\s\S]*?\}/g, '');

fs.writeFileSync('src/app/globals.css', css);
