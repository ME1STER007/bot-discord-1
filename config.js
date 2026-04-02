const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const configPath = './rangos.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar-rangos')
    .setDescription('Configurar roles por rango'),

  async execute(interaction) {

    await interaction.reply('Escribí los nombres de los roles separados por coma:\nEj: Bronce,Plata,Oro,Diamante,Challenger');

    const filter = m => m.author.id === interaction.user.id;

    const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

    collector.on('collect', msg => {

      const nombres = msg.content.split(',');

      const data = {
        bronce: nombres[0],
        plata: nombres[1],
        oro: nombres[2],
        diamante: nombres[3],
        challenger: nombres[4]
      };

      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

      interaction.followUp('✅ Rangos configurados correctamente');
    });
  }
};