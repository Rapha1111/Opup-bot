require('dotenv').config();
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');
const commands = require('./commands');

const map = new Map(commands.map((c) => [c.data.name, c]));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', (c) => console.log(`Connecté en tant que ${c.user.tag}`));

client.on('interactionCreate', async (i) => {
  try {
    if (i.isModalSubmit()) return await commands.handleModal(i);
    if (!i.isChatInputCommand()) return;
    const cmd = map.get(i.commandName);
    if (cmd) await cmd.execute(i);
  } catch (err) {
    console.error(err);
    const msg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
    if (i.replied || i.deferred) await i.followUp(msg).catch(() => {});
    else await i.reply(msg).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
