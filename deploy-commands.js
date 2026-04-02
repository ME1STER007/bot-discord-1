require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ======================
// 🔍 VALIDACIÓN ENV
// ======================
if (!process.env.TOKEN) {
  console.log('❌ Falta TOKEN en .env');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.log('❌ Falta CLIENT_ID en .env');
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.log('❌ Falta GUILD_ID en .env');
  process.exit(1);
}

// ======================
// 📂 CARGAR COMANDOS
// ======================
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
  console.log('❌ No existe la carpeta /commands');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📂 Comandos encontrados:', commandFiles);

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);

    if (!command.data || !command.data.toJSON) {
      console.log(`⚠️ ${file} no tiene "data" válido`);
      continue;
    }

    commands.push(command.data.toJSON());
    console.log(`✅ Cargado: ${command.data.name}`);

  } catch (err) {
    console.log(`❌ Error en ${file}:`, err.message);
  }
}

// ======================
// 🚀 DEPLOY
// ======================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🚀 Registrando comandos en el servidor...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Comandos registrados correctamente!');
    console.log(`📊 Total: ${commands.length} comandos`);

  } catch (error) {
    console.error('❌ ERROR AL REGISTRAR:', error);
  }
})();