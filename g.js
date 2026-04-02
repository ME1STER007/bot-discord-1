const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('g')
    .setDescription('Crear partida'),

  async execute(interaction) {

    const botones = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('modo_2v2').setLabel('2v2').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_3v3').setLabel('3v3').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_4v4').setLabel('4v4').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_5v5').setLabel('5v5').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_6v6').setLabel('6v6').setStyle(ButtonStyle.Primary),
    );

    const botones2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('modo_6v6s').setLabel('6v6 con soporte').setStyle(ButtonStyle.Success),
    );

    await interaction.reply({
      content: '🎮 Elegí el modo:',
      components: [botones, botones2],
    });
  },
};