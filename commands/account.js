import { SlashCommandBuilder } from '@discordjs/builders';
export default {
    aliases: ['acc', 'me'],
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('Shows your account panel'),
    async execute(interaction) {
        await interaction.reply('Hello!');
    }
};
