require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('DISCORD_TOKEN et CLIENT_ID sont requis dans .env');
  process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);
const body = commands.map((c) => c.data.toJSON());
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
  : Routes.applicationCommands(CLIENT_ID);

rest.put(route, { body }).then(
  () => console.log(`${body.length} commandes déployées (${GUILD_ID ? 'serveur de test' : 'global'}).`),
  (e) => { console.error(e); process.exit(1); }
);
