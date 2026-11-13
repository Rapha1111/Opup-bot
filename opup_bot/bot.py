import os
from urllib.parse import urlparse

import discord
from discord import app_commands
from dotenv import load_dotenv

from . import store

COLOR = 0x5865F2


def parse_link(raw: str) -> str | None:
    """Retourne l'URL nettoyée si elle est valide (http/https + hôte), sinon None."""
    raw = raw.strip()
    try:
        u = urlparse(raw)
    except ValueError:
        return None
    if u.scheme in ("http", "https") and u.hostname and " " not in raw:
        return raw
    return None


class SettingsModal(discord.ui.Modal, title="Paramètres OPUP"):
    link = discord.ui.TextInput(
        label="Lien d'invitation OPUP",
        placeholder="https://opup/...",
        style=discord.TextStyle.short,
        required=True,
        max_length=200,
    )

    def __init__(self, current: str | None):
        super().__init__()
        if current:
            self.link.default = current

    async def on_submit(self, interaction: discord.Interaction):
        if not interaction.permissions.manage_guild:
            return await interaction.response.send_message("❌ Permission insuffisante.", ephemeral=True)
        url = parse_link(self.link.value)
        if not url:
            return await interaction.response.send_message(
                "❌ Lien invalide. Il doit ressembler à `https://opup/...`.", ephemeral=True
            )
        store.set_invite(interaction.guild_id, url)
        await interaction.response.send_message(
            f"✅ Lien OPUP enregistré pour ce serveur : {url}", ephemeral=True
        )


class OpupBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        guild_id = os.getenv("GUILD_ID")
        if guild_id:  # déploiement instantané sur un serveur de test
            guild = discord.Object(int(guild_id))
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()


bot = OpupBot()


@bot.tree.command(name="settings", description="Paramétrer le lien d'invitation vers la communauté OPUP")
@app_commands.guild_only()
@app_commands.default_permissions(manage_guild=True)
async def settings(interaction: discord.Interaction):
    await interaction.response.send_modal(SettingsModal(store.get_invite(interaction.guild_id)))


@bot.tree.command(name="link", description="Poster un embed avec un bouton pour rejoindre la communauté OPUP")
@app_commands.guild_only()
@app_commands.default_permissions(manage_guild=True)
async def link(interaction: discord.Interaction):
    url = store.get_invite(interaction.guild_id)
    if not url:
        return await interaction.response.send_message(
            "⚠️ Aucun lien configuré. Utilise d'abord `/settings`.", ephemeral=True
        )
    embed = discord.Embed(
        title="🚀 Rejoins la communauté OPUP !",
        description="Clique sur le bouton ci-dessous pour rejoindre la communauté OPUP.",
        color=COLOR,
    )
    view = discord.ui.View()
    view.add_item(discord.ui.Button(label="Rejoindre OPUP", style=discord.ButtonStyle.link, url=url))
    try:
        await interaction.channel.send(embed=embed, view=view)
    except discord.HTTPException:
        return await interaction.response.send_message(
            "❌ Je ne peux pas écrire dans ce salon. Vérifie mes permissions.", ephemeral=True
        )
    await interaction.response.send_message("✅ Message envoyé.", ephemeral=True)


@bot.tree.command(name="join", description="Recevoir le lien pour rejoindre la communauté OPUP")
@app_commands.guild_only()
async def join(interaction: discord.Interaction):
    url = store.get_invite(interaction.guild_id)
    if not url:
        return await interaction.response.send_message(
            "⚠️ Le lien de la communauté OPUP n'a pas encore été configuré sur ce serveur. "
            "Demande à un administrateur.",
            ephemeral=True,
        )
    await interaction.response.send_message(
        f"👋 Voici le lien pour rejoindre la communauté OPUP :\n{url}", ephemeral=True
    )


def main():
    load_dotenv()
    token = os.getenv("DISCORD_TOKEN")
    if not token:
        raise SystemExit("DISCORD_TOKEN manquant dans .env")
    bot.run(token)
