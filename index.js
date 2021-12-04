import dotenv from 'dotenv';
import * as fs from 'fs';
import { Client, Intents, Collection } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
dotenv.config();
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.commands = new Collection();
client.aliases = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandsPromise = await Promise.all(commandFiles.map(async (file) => {
    return import(`./commands/${file}`);
}));
for (const { default: command } of commandsPromise) {
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
    if (command.aliases) {
        command.aliases.forEach((alias) => {
            client.aliases.set(alias, command);
        });
    }
}
const DEPLOY_GLOBAL = false;
client.on('ready', () => {
    console.log(`Logged in: ${client.user.tag}`);
    client.user.setStatus('online');
    client.user.setActivity('/help', { type: 'WATCHING' });
    const CLIENT_ID = client.user.id;
    const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
    (async () => {
        try {
            if (DEPLOY_GLOBAL) {
                await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
                console.log('OK: Registered Slash (/) Commands globally');
            }
            else {
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, process.env.DEV_GUILD), { body: commands });
                console.log('OK: Registered Slash (/) Commands in development guild');
            }
        }
        catch (error) {
            console.error(error);
        }
    })();
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand())
        return;
    const command = client.commands.get(interaction.commandName) || client.aliases.get(interaction.commandName);
    if (!command)
        return;
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command', ephemeral: true });
    }
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton())
        return;
    const button = interaction.customId;
});
client.login(process.env.BOT_TOKEN);
