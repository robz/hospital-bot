const Discord = require('discord.js');
const auth = require('./auth.json');
const commands = require('./commands');

const client = new Discord.Client();

function getPrefix() {
  return `<@${client.user.id}>`;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  if (message.author.tag === client.user.tag) {
    // ignore messages from me
    return;
  }

  let content = message.content;
  const prefix = getPrefix();
  if (!content.startsWith(prefix)) {
    // ignore message unless it starts my name
    return;
  }

  content = content.substring(prefix.length + 1);
  const anyCommandMatched = commands.some(({pattern, run}) => {
    const data = content.match(pattern);
    if (data) {
      run(message, data);
      // command matched, so don't keep iterating
      return true;
    }
  });

  console.log(message.content);

  if (!anyCommandMatched) {
    commands[0].run(
      message,
      null,
      `I don't understand the command "${content}"`,
    );
  }
});

client.login(auth.token);
