const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

function getRank(puntos) {
  if (puntos >= 2000) return { name: 'Challenger', color: '#ff0000' };
  if (puntos >= 1500) return { name: 'Diamante', color: '#00ffff' };
  if (puntos >= 1000) return { name: 'Oro', color: '#ffd700' };
  if (puntos >= 500) return { name: 'Plata', color: '#c0c0c0' };
  return { name: 'Bronce', color: '#cd7f32' };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Ver stats en tarjeta')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Jugador')
        .setRequired(false)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const user = interaction.options.getUser('usuario') || interaction.user;

    let stats = {};
    try {
      stats = JSON.parse(fs.readFileSync('./stats.json'));
    } catch {
      return interaction.editReply('No hay stats.');
    }

    if (!stats[user.id]) {
      return interaction.editReply('Este jugador no tiene stats.');
    }

    const s = stats[user.id];

    const total = s.wins + s.losses;
    const winrate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : 0;

    const rank = getRank(s.puntos);

    const canvas = createCanvas(900, 450);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(50, 50, 800, 350);

    ctx.strokeStyle = rank.color;
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 50, 800, 350);

    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 140, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 60, 80, 120, 120);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.fillText(user.username, 220, 120);

    ctx.fillStyle = rank.color;
    ctx.font = '22px sans-serif';
    ctx.fillText(rank.name, 220, 150);

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';

    ctx.fillText(`🏆 Puntos: ${s.puntos}`, 220, 200);
    ctx.fillText(`⭐ MVP: ${s.mvp}`, 220, 230);
    ctx.fillText(`👑 Creador: ${s.creador}`, 220, 260);

    ctx.fillText(`✅ Wins: ${s.wins}`, 500, 200);
    ctx.fillText(`❌ Losses: ${s.losses}`, 500, 230);
    ctx.fillText(`📊 Winrate: ${winrate}%`, 500, 260);

    ctx.fillStyle = '#333';
    ctx.fillRect(220, 300, 500, 20);

    ctx.fillStyle = rank.color;
    ctx.fillRect(220, 300, 500 * (winrate / 100), 20);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: 'stats.png',
    });

    await interaction.editReply({ files: [attachment] });
  }
};