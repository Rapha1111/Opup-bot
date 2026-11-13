# OPUP Bot

Bot Discord (Python / discord.py) qui permet à chaque serveur de promouvoir la communauté OPUP. Chaque serveur a son propre lien d'invitation.

## Commandes
| Commande | Qui | Rôle |
|---|---|---|
| `/settings` | Gérer le serveur | Ouvre un popup pour saisir le lien OPUP du serveur |
| `/link` | Gérer le serveur | Poste dans le salon courant un embed avec un bouton « Rejoindre OPUP » |
| `/join` | Tout le monde | Envoie le lien en message éphémère |

## Installation
1. Créer une application sur https://discord.com/developers/applications, ajouter un bot.
2. `cp .env.example .env` et renseigner `DISCORD_TOKEN` (et `GUILD_ID` pour tester).
3. `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
4. `python main.py` (les commandes sont synchronisées au démarrage)
5. Inviter le bot avec les scopes `bot applications.commands` et les permissions *Envoyer des messages* + *Intégrer des liens*.

Les liens sont stockés dans `data/invites.json` (un lien par ID de serveur).
