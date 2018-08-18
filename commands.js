const numDays = 90;
const minNumMessages = 3;
const numDaysAgo = new Date(
  new Date().getTime() - numDays * 24 * 60 * 60 * 1000,
);

async function tryDeprecatingChannels(message, channels) {
  const deprecatedCategory = [...message.guild.channels.values()].find(
    e => e.type === 'category' && e.name === 'Deprecated',
  );

  if (!deprecatedCategory) {
    message.reply(`I couldn't find a category called "Deprecated"`);
    return;
  }

  const everyoneRole = [...message.guild.roles.values()].find(
    e => e.name === '@everyone',
  );

  if (!everyoneRole) {
    message.reply(`I couldn't find a role called "@everyone"`);
    return;
  }

  const notDeprecated = [];
  for (const channel of channels) {
    const messages = await channel.fetchMessages({limit: minNumMessages});
    const messagesInLastNumDays = [...messages.values()].filter(
      e => e.createdTimestamp > numDaysAgo,
    );
    if (messagesInLastNumDays.length === minNumMessages) {
      notDeprecated.push(channel.name);
      continue;
    }

    await channel.setParent(deprecatedCategory.id);
    await channel.overwritePermissions(
      everyoneRole,
      {
        SEND_MESSAGES: false,
      },
      `deprecating at ${message.author}'s request`,
    );
    message.reply(
      `Deprecated ${channel.name} because there's only been ${
        messagesInLastNumDays.length
      } messages in the last ${numDays} days`,
    );
  }

  if (notDeprecated.length) {
    message.reply(
      `Can't deprecate ${notDeprecated.join(
        ', ',
      )} because they each have ${minNumMessages} or more messages in the last ${numDays} days`,
    );
  }
}

function getStuff() {}

const commands = [
  {
    pattern: /^(help)?$/,
    description: 'explain usage',
    run: async (message, _, extra) => {
      const commandDescs = commands
        .map(
          ({pattern, description}) => pattern.toString() + ' :: ' + description,
        )
        .join('\n');

      let reply = `All supported commands:\n${commandDescs}`;

      const exampleCommand = 'deprecate --channel general';
      if (!exampleCommand.match(commands[1].pattern)) {
        console.error(`example ${exampleCommand} doesn't parse!`);
      } else {
        reply = `Example command: "${exampleCommand}"\n${reply}`;
      }

      if (extra != null) {
        reply = `${extra}\n${reply}`;
      }

      message.reply(reply);
    },
  },
  {
    pattern: /^deprecate --channel ([a-z-]+)$/,
    description:
      'move a channel to the "Deprecated" category and disable messaging permissions',
    run: async (message, [_, channelName]) => {
      const channel = [...message.guild.channels.values()].find(
        e => e.type === 'text' && e.name === channelName,
      );

      if (!channel) {
        message.reply(`I couldn't find channel called "${channelName}"`);
        return;
      }

      try {
        await tryDeprecatingChannels(message, [channel]);
      } catch (e) {
        message.reply(`Encountered an error: ${e.message}`);
      }
    },
  },
  {
    pattern: /^deprecate --all$/,
    description: 'deprecate all eligible channels',
    run: async (message, [_, channelName]) => {
      const channels = [...message.guild.channels.values()].filter(
        e => e.type === 'text' && !(e.parent && e.parent.name === 'Deprecated'),
      );

      message.reply(`Checking: ${channels.map(e => e.name).join(', ')}`);

      try {
        await tryDeprecatingChannels(message, channels);
      } catch (e) {
        message.reply(`Encountered an error: ${e.message}`);
      }
    },
  },
];

module.exports = commands;
