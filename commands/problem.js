import { SlashCommandBuilder, spoiler, hyperlink, codeBlock } from '@discordjs/builders';
import { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } from 'discord.js';
import { randomInt, problemDifficulty, tests, scrapeProblem } from '../scrape.js';
import { webkit } from 'playwright';
export default {
    aliases: ['p', 'q', 'question', 'generate'],
    data: new SlashCommandBuilder()
        .setName('problem')
        .setDescription('Fetches a problem')
        .addSubcommand(subcommand => subcommand.setName('filter')
        .setDescription('Choose a contest to fetch from and with further filtering options')
        .addStringOption(option => {
        option.setName('contest')
            .setDescription("Contest to filter")
            .setRequired(true);
        for (const [, test] of Object.entries(tests)) {
            option.addChoice(test.name, test.name);
        }
        return option;
    })
        .addIntegerOption(option => option.setName('after_year').setDescription("From tests after a certain year (inclusive)"))
        .addIntegerOption(option => option.setName('before_year').setDescription("From tests before a certain year (inclusive)"))
        .addIntegerOption(option => option.setName('after_problem').setDescription("From problems after a certain index (inclusive)"))
        .addIntegerOption(option => option.setName('before_problem').setDescription("From problems before a certain index (inclusive)")))
        .addSubcommand(subcommand => subcommand.setName('specific')
        .setDescription('Fetches a specific problem')
        .addStringOption(option => {
        option.setName('contest')
            .setDescription("Contest of the problem")
            .setRequired(true);
        for (const [, test] of Object.entries(tests)) {
            if (!test.modifiers) {
                option.addChoice(test.name, test.name);
                continue;
            }
            for (let ii = 0; ii < test.modifiers.length; ++ii) {
                option.addChoice(test.name + " " + test.modifiers[ii], test.name + " " + test.modifiers[ii]);
            }
        }
        return option;
    })
        .addIntegerOption(option => option.setName('year').setDescription("Year of the problem").setRequired(true))
        .addIntegerOption(option => option.setName('problem').setDescription("Index of the problem").setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('random')
        .setDescription('Fetches a random problem from past contests')),
    async execute(interaction) {
        await interaction.deferReply();
        let options = interaction.options;
        let p;
        if (options.getSubcommand() === 'random') {
            let t = Object.keys(tests)[randomInt(0, Object.keys(tests).length - 1)];
            let test = tests[t];
            p = {
                test: test.name,
                modifier: (test.modifiers ? test.modifiers[randomInt(0, test.modifiers.length - 1)] : ""),
                year: randomInt(test.yearRange[0], test.yearRange[1]),
                problem: randomInt(test.problemRange[0], test.problemRange[1]),
                difficulty: 0
            };
            p.difficulty = problemDifficulty(t, p.year, p.problem);
        }
        else if (options.getSubcommand() === 'specific') {
            const [[contest, modifier], year, problem] = [options.getString("contest").split(' '), options.getInteger("year"), options.getInteger("problem")];
            let test = tests[contest];
            if (year > test.yearRange[1] || year < test.yearRange[0]) {
                await interaction.editReply(codeBlock(`Command failed: There is no ${test.name} contest for the year ${year}`));
                return;
            }
            if (problem > test.problemRange[1] || problem < test.problemRange[0]) {
                await interaction.editReply(codeBlock(`Command failed: There is no problem ${problem} for the ${year} ${test.name}`));
                return;
            }
            p = {
                test: contest,
                modifier: modifier,
                year: year,
                problem: problem,
                difficulty: 0
            };
            p.difficulty = problemDifficulty(contest, year, problem);
        }
        else {
            let [t, after_year, before_year, after_problem, before_problem] = [options.getString('contest'), options.getInteger('after_year'), options.getInteger('before_year'), options.getInteger('after_problem'), options.getInteger('before_problem')];
            let test = tests[t];
            // Input validation hell...
            if (after_year && before_year && after_year < before_year) {
                await interaction.editReply(codeBlock('Command failed: after_year should not be less than before_year'));
                return;
            }
            if (after_problem && before_problem && after_problem < before_problem) {
                await interaction.editReply(codeBlock('Command failed: after_problem should not be less than before_problem'));
                return;
            }
            if (after_year && after_year > test.yearRange[1]) {
                await interaction.editReply(codeBlock(`Command failed: For the contest ${test.name}, after_year cannot be greater than ${test.yearRange[1]}`));
                return;
            }
            if (before_year && before_year < test.yearRange[0]) {
                await interaction.editReply(codeBlock(`Command failed: For the contest ${test.name}, before_year cannot be less than ${test.yearRange[0]}`));
                return;
            }
            if (after_problem && after_problem > test.problemRange[1]) {
                await interaction.editReply(codeBlock(`Command failed: For the contest ${test.name}, after_problem cannot be greater than ${test.problemRange[1]}`));
                return;
            }
            if (before_problem && before_problem < test.problemRange[0]) {
                await interaction.editReply(codeBlock(`Command failed: For the contest ${test.name}, before_problem cannot be greater than ${test.problemRange[0]}`));
                return;
            }
            p = {
                test: test.name,
                modifier: (test.modifiers ? test.modifiers[randomInt(0, test.modifiers.length - 1)] : ""),
                year: randomInt(Math.max(after_year ?? 0, test.yearRange[0]), Math.min(before_year ?? Infinity, test.yearRange[1])),
                problem: randomInt(Math.max(after_problem ?? 0, test.problemRange[0]), Math.min(before_problem ?? Infinity, test.problemRange[1])),
                difficulty: 0
            };
            p.difficulty = problemDifficulty(t, p.year, p.problem);
        }
        let problem = await scrapeProblem(p);
        if (!problem) {
            await interaction.editReply(codeBlock(`There was an error while executing the command for ${p.year} ${p.test} Problem ${p.problem}`));
            return;
        }
        const browser = await webkit.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.setContent(`
        <html>
        <head>
          <style>
            * {
                margin: 0;
                padding: 0;
            }

            *,
            *:before,
            *:after {
                box-sizing: border-box;
            }

            html,
            body {
                background: #FFF;
                font-family: 'Roboto', sans-serif;
            }

            .problem {
                padding: 20px;
                font-size: 15px;
                margin-bottom: 10px;
                line-height: 21.4333px;
            }

            .latexcenter {
                display: block;

                margin: auto;
                padding: 1em 0;

                transform: initial;
                -moz-transform: rotate(0deg);

                /* Firefox hack */
                max-width: 100%;
                height: auto;
            }

            img .latex {
                vertical-align: baseline;
                transform: initial;
                -moz-transform: rotate(0deg);
            }
          </style>
        </head>
        <body>
          <div class="problem">
            ${problem.question}
          </div>
        </body>
        </html>`, { waitUntil: 'networkidle' });
        const problemEl = await page.$('.problem');
        const boundingBox = await problemEl.boundingBox();
        const imgBuffer = await page.screenshot({
            type: 'png',
            clip: {
                x: boundingBox.x,
                y: boundingBox.y,
                width: boundingBox.width,
                height: boundingBox.height
            }
        });
        await browser.close();
        const file = new MessageAttachment(imgBuffer, 'question.png');
        const problemEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(problem.name)
            .setURL(problem.link)
            .setDescription(` ${hyperlink('Estimated difficulty', 'https://github.com/1e9end/vobot/blob/main/GUIDE.md#difficulty-estimation', 'About difficulty estimation')}: ${problem.difficulty.toFixed(2)} │ Answer: ${spoiler(problem.answer + '-'.repeat(5 - problem.answer.length))}`)
            .setImage('attachment://question.png')
            .setTimestamp()
            .setFooter(`Powered by Virtual Olympiad`);
        const row = new MessageActionRow()
            .addComponents(new MessageButton()
            .setCustomId('problem_save')
            .setLabel('Save Problem')
            .setStyle('PRIMARY'));
        await interaction.editReply({ embeds: [problemEmbed], files: [file], components: [row] });
    }
};
