// Pinokio >=8.2 supports launchers at ./pinokio/pinokio.js.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const has = name => fs.existsSync(path.join(root, 'apps', name, '.pinokio-installed.json'));
module.exports = {
  version: '8.0.0',
  title: 'Music AI: StemDeck + Pymss Studio',
  description: 'Install and run two open-source local music stem separation tools on NVIDIA GPUs.',
  menu: async (kernel, info) => {
    const windows = kernel.platform === 'win32';
    const linux = kernel.platform === 'linux';
    if (!windows && !linux) return [{
      text: 'Supported: Windows x64 or Linux x64',
      icon: 'fa-solid fa-circle-info',
      href: 'https://github.com/ChrisTorng/AI-Tools/tree/main/pinokio',
      popout: true
    }];
    const entries = [];
    if (!has('stemdeck')) {
      entries.push({text:'Install StemDeck (NVIDIA)',icon:'fa-solid fa-download',href:'install-stemdeck.js',default:true});
    } else {
      entries.push({text:'Start StemDeck',icon:'fa-solid fa-play',href:'start-stemdeck.js',default:true});
      entries.push({text:'Update StemDeck',icon:'fa-solid fa-rotate',href:'install-stemdeck.js'});
    }
    if (windows) {
      if (!has('pymss')) {
        entries.push({text:'Install Pymss Studio (CUDA, ~2 GB)',icon:'fa-solid fa-download',href:'install-pymss-cuda.js'});
        entries.push({text:'Install Pymss Studio (Online, ~120 MB)',icon:'fa-solid fa-cloud-arrow-down',href:'install-pymss-online.js'});
      } else {
        entries.push({text:'Start Pymss Studio',icon:'fa-solid fa-play',href:'start-pymss.js'});
        entries.push({text:'Update Pymss Studio (CUDA)',icon:'fa-solid fa-rotate',href:'install-pymss-cuda.js'});
        entries.push({text:'Update Pymss Studio (Online)',icon:'fa-solid fa-rotate',href:'install-pymss-online.js'});
      }
    } else if (!has('pymss')) {
      entries.push({text:'Prepare Pymss Studio (Linux experimental source build)',icon:'fa-solid fa-hammer',href:'install-pymss-linux.js'});
    } else {
      entries.push({text:'Run Pymss Studio (Linux source)',icon:'fa-solid fa-play',href:'start-pymss.js'});
    }
    entries.push({text:'Documentation and known limitations',icon:'fa-solid fa-book',href:'https://github.com/ChrisTorng/AI-Tools/tree/main/pinokio',popout:true});
    return entries;
  }
};
