# OPUP Bot

Bot Discord qui permet à chaque serveur de promouvoir la communauté OPUP. Chaque serveur a son propre lien d'invitation.

## Commandes
| Commande | Qui | Rôle |
|---|---|---|
| `/settings [lien]` | Gérer le serveur | Enregistre (ou affiche) le lien d'invitation OPUP du serveur |
| `/link [salon]` | Gérer le serveur | Poste un embed avec un bouton « Rejoindre OPUP » |
| `/join` | Tout le monde | Envoie le lien en message éphémère |

## Installation
1. Créer une application sur https://discord.com/developers/applications, ajouter un bot.
2. `cp .env.example .env` et renseigner `DISCORD_TOKEN`, `CLIENT_ID` (et `GUILD_ID` pour tester).
3. `npm install && npm run deploy && npm start`
4. Inviter le bot avec les scopes `bot applications.commands` et les permissions *Envoyer des messages* + *Intégrer des liens*.

Les liens sont stockés dans `data/invites.json` (un lien par ID de serveur).
