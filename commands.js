const numDays = 90;
const minNumMessages = 3;
const numDaysAgo = new Date(
  new Date().getTime() - numDays * 24 * 60 * 60 * 1000,
);

async function tryDeprecatingChannel(
  message,
  channel,
  deprecatedCategory,
  everyoneRole,
) {
  const messages = await channel.fetchMessages({limit: minNumMessages});
  const messagesInLastNumDays = [...messages.values()].filter(
    e => e.createdTimestamp > numDaysAgo,
  );
  if (messagesInLastNumDays.length === minNumMessages) {
    message.reply(
      `Can't deprecate ${
        channel.name
      } because it has ${minNumMessages} or more messages in the last ${numDays} days`,
    );
    return;
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

const commands = [
  {
    pattern: /^(help)?$/,
    description: 'explain usage',
    run: async (client, message, _, extra) => {
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
    run: async (client, message, [_, channelName]) => {
      const channel = [...client.channels.values()].find(
        e => e.type === 'text' && e.name === channelName,
      );

      if (!channel) {
        message.reply(`I couldn't find channel called "${channelName}"`);
        return;
      }

      const deprecatedCategory = [...client.channels.values()].find(
        e => e.type === 'category' && e.name === 'Deprecated',
      );

      if (!deprecatedCategory) {
        message.reply(`I couldn't find a category called "Deprecated"`);
        return;
      }

      const everyoneRole = [...client.guilds.first().roles.values()].find(
        e => e.name === '@everyone',
      );

      if (!everyoneRole) {
        message.reply(`I couldn't find a role called "@everyone"`);
        return;
      }

      try {
        tryDeprecatingChannel(
          message,
          channel,
          deprecatedCategory,
          everyoneRole,
        );
      } catch (e) {
        message.reply(`Encountered an error: ${e.message}`);
      }
    },
  },
  {
    pattern: /^deprecate --all$/,
    description: 'deprecate all eligible channels',
    run: async (client, message, [_, channelName]) => {
      const deprecatedCategory = [...client.channels.values()].find(
        e => e.type === 'category' && e.name === 'Deprecated',
      );

      if (!deprecatedCategory) {
        message.reply(`I couldn't find a category called "Deprecated"`);
        return;
      }

      const everyoneRole = [...client.guilds.first().roles.values()].find(
        e => e.name === '@everyone',
      );

      if (!everyoneRole) {
        message.reply(`I couldn't find a role called "@everyone"`);
        return;
      }

      const channels = [...client.channels.values()].filter(
        e => e.type === 'text' && !(e.parent && e.parent.name === 'Deprecated'),
      );

      message.reply(`Checking: ${channels.map(e => e.name).join(', ')}`);

      try {
        for (const channel of channels) {
          await tryDeprecatingChannel(
            message,
            channel,
            deprecatedCategory,
            everyoneRole,
          );
        }
      } catch (e) {
        message.reply(`Encountered an error: ${e.message}`);
      }
    },
  },
];

module.exports = commands;
