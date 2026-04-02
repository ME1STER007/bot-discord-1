const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacion')
    .setDescription('Enviar mensaje de verificación'),

  async execute(interaction) {

    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('✅ Aceptar reglas')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: '📜 **Aceptá las reglas para acceder al servidor**',
      components: [row]
    });
  }
};