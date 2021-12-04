import { SlashCommandBuilder, hyperlink, inlineCode, bold } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
export default {
    aliases: ['about', 'info'],
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows the help panel'),
    async execute(interaction) {
        const embed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("Help Menu")
            .setURL("https://github.com/1e9end/vobot/blob/main/GUIDE.md")
            .setDescription('VOBot is a Discord Bot built for competition math')
            .addFields({ name: 'About', value: `VOBot was created by ${hyperlink('1egend', 'https://1e9end.github.io', 'a.k.a polarity')} as part of ${hyperlink('Virtual Olympiad', 'https://virtual-olympiad.1egend.repl.co/')}, a series of projects for competition math. View VOBot's ${hyperlink('source code', 'https://github.com/1e9end/vobot', 'Github Repo')}.` }, { name: 'Commands', value: `Only supports slash (/) commands for now. Currently you are only able to fetch problems from past AMC and AIME contests. More contests to be added soon.\n${bold("* = required parameter")}` }, { name: '/problem random', value: `Fetches a random problem.`, inline: true }, { name: '/problem filter', value: `Fetches a random problem from a given contest with further filtering options.\n${bold("Parameters:")}\n${inlineCode("contest*\nafter_year\nbefore_year\nafter_problem\nbefore_problem")}\n Filters are inclusive.`, inline: true }, { name: '/problem specific', value: `Fetches a specific problem.\n${bold("Parameters:")}\n${inlineCode("contest*\nyear*\nproblem*")}`, inline: true }, { name: '/help', value: `Shows the help menu`, inline: true }, { name: '/account', value: `Shows your VOBot account menu that includes some statistics and your liked problems`, inline: true }, { name: 'Invite', value: `Click ${hyperlink('here', 'https://discord.com/api/oauth2/authorize?client_id=906642645399506974&permissions=274877908992&scope=applications.commands%20bot', 'Invite link')} to invite VOBot to your server` })
            .setFooter("Powered by Virtual Olympiad");
        await interaction.reply({ embeds: [embed] });
    }
};
