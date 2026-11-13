const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'invites.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE);
}

// Un lien d'invitation unique par serveur (clé = ID du serveur)
module.exports = {
  getInvite(guildId) {
    return load()[guildId] ?? null;
  },
  setInvite(guildId, url) {
    const data = load();
    data[guildId] = url;
    save(data);
  },
};
