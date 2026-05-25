require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');

// Verifica as variáveis de ambiente
if (!process.env.DISCORD_TOKEN) {
  console.error("ERRO: DISCORD_TOKEN não encontrado no arquivo .env");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  {
    name: 'mapa',
    description: 'Acesse o Mapa Interativo de Fromville',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`✅ Bot logado como ${client.user.tag}`);
  
  try {
    console.log('Registrando Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('✅ Comandos globais registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'mapa') {
    // Altere WEB_URL no .env quando hospedar o mapa
    const webAppUrl = process.env.WEB_URL || 'https://seu-usuario.github.io/interactive-map/';

    const embed = new EmbedBuilder()
      .setColor('#2b2b2b')
      .setTitle('🗺️ Mapa Interativo de Fromville')
      .setDescription('Explore a cidade, descubra Safe Houses, Landmarks e desvende os mistérios de Fromville.')
      .setImage('https://images.unsplash.com/photo-1548345680-f5475ea90f14?auto=format&fit=crop&q=80&w=1000') // Placeholder Image
      .setFooter({ text: 'Fromville Map System' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Abrir Mapa Interativo')
          .setURL(webAppUrl)
          .setStyle(ButtonStyle.Link),
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
});

client.login(process.env.DISCORD_TOKEN);
