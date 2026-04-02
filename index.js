require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ======================
// 📊 STATS
// ======================
const statsPath = './stats.json';

function getStats() {
  if (!fs.existsSync(statsPath)) fs.writeFileSync(statsPath, '{}');
  return JSON.parse(fs.readFileSync(statsPath));
}

function saveStats(data) {
  fs.writeFileSync(statsPath, JSON.stringify(data, null, 2));
}

// ======================
// 🏆 RANGOS
// ======================
function getRango(p) {
  if (p >= 6000) return 'MAESTRO';
  if (p >= 3501) return 'HEROICO';
  if (p >= 2801) return 'DIAMANTE';
  if (p >= 2101) return 'PLATINO';
  if (p >= 1401) return 'ORO';
  if (p >= 701) return 'PLATA';
  return 'BRONCE';
}

async function actualizarRol(member, puntos) {
  const rango = getRango(puntos);
  const nombres = ['BRONCE','PLATA','ORO','PLATINO','DIAMANTE','HEROICO','MAESTRO'];

  for (const n of nombres) {
    const r = member.guild.roles.cache.find(x => x.name === n);
    if (r && member.roles.cache.has(r.id)) {
      await member.roles.remove(r).catch(()=>{});
    }
  }

  const nuevo = member.guild.roles.cache.find(r => r.name === rango);
  if (nuevo) await member.roles.add(nuevo).catch(()=>{});
}

// ======================
// 📦 SALAS
// ======================
let salas = {};
let contador = 1;
let libres = [];

function crearSala(user, modo) {
  let id = libres.length > 0 ? libres.shift() : contador++;

  salas[id] = {
    id,
    creador: user.id,
    modo,
    size: parseInt(modo.split('v')[0]),
    azul: [],
    rojo: [],
    canal: null
  };

  return salas[id];
}

// ======================
// 🎨 EMBED
// ======================
function embedSala(s) {
  const lista = (arr) => {
    let txt = '';
    for (let i = 0; i < s.size; i++) {
      txt += arr[i] ? `• <@${arr[i]}>\n` : `• Libre\n`;
    }
    return txt;
  };

  return new EmbedBuilder()
    .setTitle(`🎮 Partida ${s.id} • ${s.modo}`)
    .setColor('#ff2d55')
    .addFields(
      { name: `🔵 Azul (${s.azul.length}/${s.size})`, value: lista(s.azul), inline: true },
      { name: `🔴 Rojo (${s.rojo.length}/${s.size})`, value: lista(s.rojo), inline: true }
    );
}

// ======================
// 🔘 BOTONES
// ======================
function botonesSala(s) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`join_azul_${s.id}`).setLabel('Azul').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`join_rojo_${s.id}`).setLabel('Rojo').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`leave_${s.id}`).setLabel('Salir').setStyle(ButtonStyle.Secondary)
  );
}

// ======================
// 📂 COMANDOS
// ======================
client.commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ======================
// 🚀 READY
// ======================
client.once(Events.ClientReady, () => {
  console.log(`✅ Bot listo`);
});

// ======================
// 🎮 INTERACCIONES
// ======================
client.on(Events.InteractionCreate, async interaction => {

  // SLASH COMMANDS
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) return command.execute(interaction);
  }

  if (!interaction.isButton()) return;

  const id = interaction.customId;

  try {
    await interaction.deferUpdate();

    // CREAR SALA
    if (id.startsWith('modo_')) {
      const modo = id.replace('modo_', '');
      const s = crearSala(interaction.user, modo);

      return interaction.message.edit({
        embeds: [embedSala(s)],
        components: [botonesSala(s)]
      });
    }

    // JOIN / LEAVE
    if (id.startsWith('join_') || id.startsWith('leave_')) {

      let accion, equipo, salaId;

      if (id.startsWith('join_')) {
        const parts = id.split('_');
        accion = parts[0];
        equipo = parts[1];
        salaId = parts[2];
      } else {
        const parts = id.split('_');
        accion = parts[0];
        salaId = parts[1];
      }

      const s = salas[salaId];
      if (!s) return;

      const uid = interaction.user.id;

      s.azul = s.azul.filter(x => x !== uid);
      s.rojo = s.rojo.filter(x => x !== uid);

      if (accion === 'join') {
        if (equipo === 'azul' && s.azul.length < s.size) s.azul.push(uid);
        if (equipo === 'rojo' && s.rojo.length < s.size) s.rojo.push(uid);
      }

      // SALA LLENA
      if (s.azul.length === s.size && s.rojo.length === s.size) {

        const jugadores = [...s.azul, ...s.rojo];

        const canal = await interaction.guild.channels.create({
          name: `partida-${s.id}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            ...jugadores.map(id => ({
              id,
              allow: [PermissionsBitField.Flags.ViewChannel]
            }))
          ]
        });

        s.canal = canal;

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`win_azul_${s.id}`).setLabel('Ganó Azul').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`win_rojo_${s.id}`).setLabel('Ganó Rojo').setStyle(ButtonStyle.Danger)
        );

        await canal.send({
          content: '🔥 Sala completa\n👑 Solo el creador decide',
          components: [row]
        });

        return interaction.message.edit({
          content: `✅ Sala creada: ${canal}`,
          embeds: [],
          components: []
        });
      }

      return interaction.message.edit({
        embeds: [embedSala(s)],
        components: [botonesSala(s)]
      });
    }

    // GANADOR
    if (id.startsWith('win_')) {

      const salaId = id.split('_')[2];
      const s = salas[salaId];
      if (!s) return;

      if (interaction.user.id !== s.creador) {
        return interaction.followUp({
          content: '❌ Solo el creador puede elegir ganador',
          ephemeral: true
        });
      }

      s.ganador = id.includes('azul') ? 'azul' : 'rojo';

      const jugadores = [...s.azul, ...s.rojo];
      const row = new ActionRowBuilder();

      jugadores.forEach(uid => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`mvp_${uid}_${s.id}`)
            .setLabel(interaction.guild.members.cache.get(uid)?.user.username || 'Jugador')
            .setStyle(ButtonStyle.Primary)
        );
      });

      return interaction.message.edit({
        content: '⭐ Elegí MVP',
        components: [row]
      });
    }

    // MVP
    if (id.startsWith('mvp_')) {

      const [, uid, salaId] = id.split('_');
      const s = salas[salaId];
      if (!s) return;

      if (interaction.user.id !== s.creador) {
        return interaction.followUp({
          content: '❌ Solo el creador decide el MVP',
          ephemeral: true
        });
      }

      s.mvp = uid;

      const jugadores = [...s.azul, ...s.rojo];
      const row = new ActionRowBuilder();

      jugadores.forEach(id => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`creador_${id}_${s.id}`)
            .setLabel(interaction.guild.members.cache.get(id)?.user.username || 'Jugador')
            .setStyle(ButtonStyle.Secondary)
        );
      });

      return interaction.message.edit({
        content: '👑 ¿Quién creó la sala?',
        components: [row]
      });
    }

    // FINAL
    if (id.startsWith('creador_')) {

      const [, creadorId, salaId] = id.split('_');
      const s = salas[salaId];
      if (!s) return;

      if (interaction.user.id !== s.creador) {
        return interaction.followUp({
          content: '❌ Solo el creador decide esto',
          ephemeral: true
        });
      }

      const stats = getStats();
      const jugadores = [...s.azul, ...s.rojo];

      jugadores.forEach(id => {
        if (!stats[id]) stats[id] = { puntos: 0, wins: 0, losses: 0, mvp: 0, creador: 0 };

        const win =
          (s.ganador === 'azul' && s.azul.includes(id)) ||
          (s.ganador === 'rojo' && s.rojo.includes(id));

        stats[id].puntos += win ? 50 : -30;
        win ? stats[id].wins++ : stats[id].losses++;

        if (id === s.mvp) {
          stats[id].puntos += 20;
          stats[id].mvp++;
        }

        if (id === creadorId) {
          stats[id].puntos += 15;
          stats[id].creador++;
        }
      });

      saveStats(stats);

      const ranking = Object.entries(stats).sort((a,b)=>b[1].puntos-a[1].puntos);

      for (let i = 0; i < ranking.length; i++) {
        const member = await interaction.guild.members.fetch(ranking[i][0]).catch(()=>null);
        if (!member) continue;

        await member.setNickname(`RANK ${i+1} | ${member.user.username}`).catch(()=>{});
        await actualizarRol(member, ranking[i][1].puntos);
      }

      if (s.canal) {
        setTimeout(() => s.canal.delete().catch(()=>{}), 5000);
      }

      delete salas[salaId];
      libres.push(parseInt(salaId));

      return interaction.message.edit({
        content: `🏆 Resultado\nGanador: ${s.ganador}\nMVP: <@${s.mvp}>`,
        components: []
      });
    }

  } catch (e) {
    console.log(e);
  }
});

client.login(process.env.TOKEN);