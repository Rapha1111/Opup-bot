import os
from urllib.parse import urlparse

import discord
from discord import app_commands
from dotenv import load_dotenv

from . import store

COLOR = 0x4A90F0
CREDIT_EMOJI = "<:credit:1567952456271274146>"


def referral_code(url: str) -> str | None:
    """Ce qui suit « opup.app/ » dans le lien (ex: https://opup.app/EPITA -> EPITA)."""
    code = urlparse(url).path.strip("/")
    return code or None


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
    code = referral_code(url)
    description = f"{CREDIT_EMOJI} **100 crédits offerts** avec le code : **{code}**" if code else None
    embed = discord.Embed(title="Rejoins la communauté OPUP", description=description, color=COLOR)
    embed.set_thumbnail(url=interaction.client.user.display_avatar.url)
    embed.set_footer(text="Crédits fictifs sans valeur monétaire")
    view = discord.ui.View()
    view.add_item(discord.ui.Button(label="Rejoindre", emoji="🔥", style=discord.ButtonStyle.link, url=url))
    # Réponse directe à l'interaction : ne nécessite pas la permission d'écrire dans le salon
    await interaction.response.send_message(embed=embed, view=view)


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
