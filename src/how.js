import '../css/charted-waters.css';
import { initLayout } from './layout.js';
import { loadDrops } from './utils.js';

async function main() {
  try {
    const data = await loadDrops();
    initLayout({ currentPage: 'how', site: data.site, person: data.person });
  } catch (error) {
    console.error(error);
  }
}

main();
