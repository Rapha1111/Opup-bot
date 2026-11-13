const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const store = require('./store');

const COLOR = 0x5865f2;
const MODAL_ID = 'settings_modal';
const FIELD_ID = 'invite_link';

function parseLink(raw) {
  try {
    const u = new URL(raw.trim());
    return ['http:', 'https:'].includes(u.protocol) && u.hostname ? u.href : null;
  } catch {
    return null;
  }
}

const notConfigured = (admin) =>
  admin
    ? "⚠️ Aucun lien d'invitation n'est configuré. Utilise d'abord `/settings`."
    : "⚠️ Le lien de la communauté OPUP n'a pas encore été configuré sur ce serveur. Demande à un administrateur.";

const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('settings')
      .setDescription("Paramétrer le lien d'invitation vers la communauté OPUP")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setDMPermission(false),
    async execute(i) {
      const input = new TextInputBuilder()
        .setCustomId(FIELD_ID)
        .setLabel("Lien d'invitation OPUP")
        .setPlaceholder('https://opup/...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(200);
      const current = store.getInvite(i.guildId);
      if (current) input.setValue(current);
      const modal = new ModalBuilder()
        .setCustomId(MODAL_ID)
        .setTitle('Paramètres OPUP')
        .addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('link')
      .setDescription('Poster un embed avec un bouton pour rejoindre la communauté OPUP')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setDMPermission(false),
    async execute(i) {
      const url = store.getInvite(i.guildId);
      if (!url) return i.reply({ content: notConfigured(true), flags: MessageFlags.Ephemeral });

      const channel = i.channel;
      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('🚀 Rejoins la communauté OPUP !')
        .setDescription('Clique sur le bouton ci-dessous pour rejoindre la communauté OPUP.');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Rejoindre OPUP').setStyle(ButtonStyle.Link).setURL(url)
      );

      try {
        await channel.send({ embeds: [embed], components: [row] });
      } catch {
        return i.reply({
          content: `❌ Je ne peux pas écrire dans ${channel}. Vérifie mes permissions.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return i.reply({ content: `✅ Message envoyé dans ${channel}.`, flags: MessageFlags.Ephemeral });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('join')
      .setDescription('Recevoir le lien pour rejoindre la communauté OPUP')
      .setDMPermission(false),
    async execute(i) {
      const url = store.getInvite(i.guildId);
      if (!url) return i.reply({ content: notConfigured(false), flags: MessageFlags.Ephemeral });
      return i.reply({
        content: `👋 Voici le lien pour rejoindre la communauté OPUP :\n${url}`,
        flags: MessageFlags.Ephemeral,
      });
    },
  },
];

commands.handleModal = async (i) => {
  if (i.customId !== MODAL_ID) return;
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return i.reply({ content: '❌ Permission insuffisante.', flags: MessageFlags.Ephemeral });
  }
  const url = parseLink(i.fields.getTextInputValue(FIELD_ID));
  if (!url) {
    return i.reply({
      content: '❌ Lien invalide. Il doit ressembler à `https://opup/...`.',
      flags: MessageFlags.Ephemeral,
    });
  }
  store.setInvite(i.guildId, url);
  return i.reply({
    content: `✅ Lien OPUP enregistré pour ce serveur : ${url}`,
    flags: MessageFlags.Ephemeral,
  });
};

module.exports = commands;
