import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

export default {
    aliases: ['acc', 'me'],
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('Shows your account panel'),
    async execute(interaction:CommandInteraction){
        await interaction.reply('Hello!')
    }
};
