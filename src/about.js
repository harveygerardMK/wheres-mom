import '../css/charted-waters.css';
import { initLayout } from './layout.js';
import { loadDrops } from './utils.js';

async function main() {
  try {
    const data = await loadDrops();
    initLayout({ currentPage: 'about', site: data.site, person: data.person });

    const name = data.person.displayName || 'Mom';
    const heading = document.querySelector('[data-about-name]');
    if (heading) heading.textContent = `About ${name}`;
  } catch (error) {
    console.error(error);
  }
}

main();
