const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('g')
    .setDescription('Crear una partida'),

  async execute(interaction) {

    // 🔐 IDS DE ROLES PERMITIDOS (LOS TUYOS)
    const rolesPermitidos = [
      '1488975466328228031',
      '1488975242285027548',
      '1488974101333938246'
    ];

    const memberRoles = interaction.member.roles.cache;

    // ✅ SI ES ADMINISTRADOR, PASA DIRECTO
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {

      const tienePermiso = memberRoles.some(r => rolesPermitidos.includes(r.id));

      if (!tienePermiso) {
        return interaction.reply({
          content: '❌ No tenés permiso para usar este comando',
          ephemeral: true
        });
      }
    }

    // 🎮 BOTONES
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('modo_2v2').setLabel('2v2').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_3v3').setLabel('3v3').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_4v4').setLabel('4v4').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_5v5').setLabel('5v5').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('modo_6v6').setLabel('6v6').setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({
      content: '🎮 Elegí modo:',
      components: [row]
    });
  }
};