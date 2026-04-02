const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Ver ranking'),

  async execute(interaction) {

    await interaction.deferReply(); // 👈 IMPORTANTE

    let stats = {};

    try {
      stats = JSON.parse(fs.readFileSync('./stats.json'));
    } catch {
      return interaction.editReply('No hay datos todavía.');
    }

    const ranking = Object.entries(stats)
      .sort((a, b) => b[1].puntos - a[1].puntos)
      .slice(0, 10);

    if (ranking.length === 0) {
      return interaction.editReply('No hay ranking todavía.');
    }

    let text = '🏆 Ranking\n\n';

    ranking.forEach((user, i) => {
      text += `#${i + 1} <@${user[0]}> - ${user[1].puntos} pts\n`;
    });

    await interaction.editReply(text);
  }
};