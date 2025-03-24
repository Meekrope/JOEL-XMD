import config from '../../config.cjs';

const promote = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();

    const validCommands = ['promote2', 'admin2', 'toadmin2'];

    if (!validCommands.includes(cmd)) return;

    if (!m.isGroup) return m.reply("*gяσυρ ¢σммαη∂*");
    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botAdmin = participants.find(p => p.id === botNumber)?.admin;
    const senderAdmin = participants.find(p => p.id === m.sender)?.admin;

    // Fetch owner number from config
    const ownerNumber = config.OWNER_NUMBER; // Set the owner's number in the config file (e.g. "+1234567890")

    // Allow the owner to use the command even if they are not an admin
    if (!(botAdmin || m.sender === ownerNumber)) return m.reply("*αм ησт α∂мιη ιη тнιѕ ι∂ιστ gяσυρ*");

    if (!(senderAdmin || m.sender === ownerNumber)) return m.reply("*α∂мιη яυℓє ι∂ισт*");

    if (!m.mentionedJid) m.mentionedJid = [];

    if (m.quoted?.participant) m.mentionedJid.push(m.quoted.participant);

    const users = m.mentionedJid.length > 0
      ? m.mentionedJid
      : text.replace(/[^0-9]/g, '').length > 0
      ? [text.replace(/[^0-9]/g, '') + '@s.whatsapp.net']
      : [];

    if (users.length === 0) {
      return m.reply("*мєηтιση α υѕєя тσ ρяσмσтє*");
    }
    console.log('users: ', users);
    const validUsers = users.filter(Boolean);

    const usernames = await Promise.all(
      validUsers.map(async (user) => {
        console.log('user: ', user);
        try {
          const contact = await gss.getContact(user);
          console.log('contact: ', contact);
          return contact.notify || contact.pushname || user.split('@')[0];
        } catch (error) {
          return user.split('@')[0];
        }
      })
    );
    console.log('usernames: ', usernames);

    await gss.groupParticipantsUpdate(m.from, validUsers, 'promote')
      .then(() => {
        const promotedNames = usernames.map(username => `@${username}`).join(', ');
        m.reply(`*Users ${promotedNames} promoted successfully in the group ${groupMetadata.subject}.*`);
      })
      .catch(() => m.reply('Failed to promote user(s) in the group.'));
  } catch (error) {
    console.error('Error:', error);
    m.reply('An error occurred while processing the command.');
  }
};

export default promote;
