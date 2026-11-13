const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const store = require('./store');

const COLOR = 0x5865f2;
const INVITE_RE =
  /^https?:\/\/(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[A-Za-z0-9-]+\/?$/i;

const notConfigured = (admin) =>
  admin
    ? "⚠️ Aucun lien d'invitation n'est configuré. Utilise d'abord `/settings`."
    : "⚠️ Le lien de la communauté OPUP n'a pas encore été configuré sur ce serveur. Demande à un administrateur.";

const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('settings')
      .setDescription("Paramétrer le lien d'invitation vers la communauté OPUP")
      .addStringOption((o) =>
        o
          .setName('lien')
          .setDescription("Lien d'invitation (ex: https://discord.gg/xxxx). Vide = afficher le lien actuel")
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setDMPermission(false),
    async execute(i) {
      const lien = i.options.getString('lien')?.trim();
      if (!lien) {
        const current = store.getInvite(i.guildId);
        return i.reply({
          content: current
            ? `🔗 Lien actuel : ${current}`
            : "Aucun lien configuré. Utilise `/settings lien:<lien d'invitation>`.",
          flags: MessageFlags.Ephemeral,
        });
      }
      if (!INVITE_RE.test(lien)) {
        return i.reply({
          content: "❌ Lien invalide. Il doit ressembler à `https://discord.gg/xxxx`.",
          flags: MessageFlags.Ephemeral,
        });
      }
      store.setInvite(i.guildId, lien);
      return i.reply({
        content: `✅ Lien d'invitation OPUP enregistré pour ce serveur : ${lien}`,
        flags: MessageFlags.Ephemeral,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('link')
      .setDescription('Poster un embed avec un bouton pour rejoindre la communauté OPUP')
      .addChannelOption((o) =>
        o
          .setName('salon')
          .setDescription('Salon où poster le message (par défaut : ce salon)')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setDMPermission(false),
    async execute(i) {
      const url = store.getInvite(i.guildId);
      if (!url) return i.reply({ content: notConfigured(true), flags: MessageFlags.Ephemeral });

      const channel = i.options.getChannel('salon') ?? i.channel;
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

module.exports = commands;
