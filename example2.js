// CONECTA A SHEETDB
const sheetdb = require("sheetdb-node");
const clientSheet = sheetdb({ address: 'rzo0bjbfv9y6f' });

const fs = require('fs');
const { Client, Location, List, Buttons, LocalAuth } = require('./index');

const client = new Client({
    authStrategy: new LocalAuth(),
    //proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: { 
        //args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        headless: false
    }
});

client.initialize();

console.log('==================================')
console.log('DISPARADOR PARA NÚMEROS DA PLANILHA DB 2')
console.log('===================================')
console.log('')
client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

//É ATIVADO CASO RECEBA ALGUMA MENSAGEM

client.on('message', async msg => 
{
    console.log("===============");
    console.log('NOVA MENSAGEM');
    console.log("===============");
    console.log(msg);


// DETECTA SE A MENSAGEM FOI UM COMANDO

    // se (a mensagem começar com "!sheet")
    if (msg.body.startsWith('!sheet ')) 
    {
        msg.reply('Disparando...');

        // cria variavel para dizer qual é a mensagem (pula os 7 caracteres do início)
        const mensagem = msg.body.slice(7);
        // le a planilha do sheetsdb depois nao sei oq significa esse .then(function(data)
        clientSheet.read().then(function(data) 
        {
            const respostas = JSON.parse(data);
                respostas.forEach((resposta, i) => 
                {
                    const whatsapp = resposta.whatsapp;
                    setTimeout(function() 
                    {
                        //envia a mensagem para o numero
                        //formato correto: 55xxxxxxxxxx@c.us "mensagem"
                        client.sendMessage('55' + whatsapp + '@c.us', mensagem);
                    }
                    //espera um tempo aleatório
                    ,1000 + Math.floor(Math.random() * 8000) * (1+i) )
                });

        }
        , function(error)
        {
            console.log(error);
        });
    }


    if (msg.body === '!ping reply') 
    {
        // Send a new message as a reply to the current one
        msg.reply('pong');

    } 
    else if (msg.body === '!help')
    {
        msg.reply('Disparar mensagens: !sheet [msg]')
    }
    else if (msg.body === '!ping') 
    {
        // Send a new message to the same chat
        client.sendMessage(msg.from, 'pong');
    } 
    else if (msg.body.startsWith('!subject ')) {
        // Change the group subject
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newSubject = msg.body.slice(9);
            chat.setSubject(newSubject);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } 
    else if (msg.body.startsWith('!echo ')) {
        // Replies with the same message
        msg.reply(msg.body.slice(6));
    }
    else if (msg.body === '!info') {
        let info = client.info;
        client.sendMessage(msg.from, `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.wid.user}
            Platform: ${info.platform}
        `);
    } 
      else if (msg.body === '!typing') {
        const chat = await msg.getChat();
        // simulates typing in the chat
        chat.sendStateTyping();
    } else if (msg.body === '!recording') {
        const chat = await msg.getChat();
        // simulates recording audio in the chat
        chat.sendStateRecording();
    } else if (msg.body === '!clearstate') {
        const chat = await msg.getChat();
        // stops typing or recording in the chat
        chat.clearState();
    } else if (msg.body === '!buttons') {
        let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
        client.sendMessage(msg.from, button);
    } else if (msg.body === '!list') {
        let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
        let list = new List('List body', 'btnText', sections, 'Title', 'footer');
        client.sendMessage(msg.from, list);
    } else if (msg.body === '!reaction') {
        msg.react('👍');
    } else if (msg.body === '!edit') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.fromMe) {
                quotedMsg.edit(msg.body.replace('!edit', ''));
            } else {
                msg.reply('I can only edit my own messages');
            }
        }
    } else if (msg.body === '!updatelabels') {
        const chat = await msg.getChat();
        await chat.changeLabels([0, 1]);
    } else if (msg.body === '!addlabels') {
        const chat = await msg.getChat();
        let labels = (await chat.getLabels()).map(l => l.id);
        labels.push('0');
        labels.push('1');
        await chat.changeLabels(labels);
    } else if (msg.body === '!removelabels') {
        const chat = await msg.getChat();
        await chat.changeLabels([]);
    }
});

client.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // do stuff here
    }
});

client.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(after); // message after it was deleted.
    if (before) {
        console.log(before); // message before it was deleted.
    }
});

client.on('message_revoke_me', async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    console.log(msg.body); // message before it was deleted.
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if (ack == 3) {
        // The message was read
    }
});
client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});
    /**
     * Information about the @param {message}:
     * 
     * 1. If a notification was emitted due to a group participant changing their phone number:
     * @param {message.author} is a participant's id before the change.
     * @param {message.recipients[0]} is a participant's id after the change (a new one).
     * 
     * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
     * @param {message.to} is a group chat id the event was emitted in.
     * @param {message.from} is a current user's id that got an notification message in the group.
     * Also the @param {message.fromMe} is TRUE.
     * 
     * 1.2 Otherwise:
     * @param {message.from} is a group chat id the event was emitted in.
     * @param {message.to} is @type {undefined}.
     * Also @param {message.fromMe} is FALSE.
     * 
     * 2. If a notification was emitted due to a contact changing their phone number:
     * @param {message.templateParams} is an array of two user's ids:
     * the old (before the change) and a new one, stored in alphabetical order.
     * @param {message.from} is a current user's id that has a chat with a user,
     * whos phone number was changed.
     * @param {message.to} is a user's id (after the change), the current user has a chat with.
     */


client.on('group_admin_changed', (notification) => {
    if (notification.type === 'promote') {
        /** 
          * Emitted when a current user is promoted to an admin.
          * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
          */
        console.log(`You were promoted by ${notification.author}`);
    } else if (notification.type === 'demote')
        /** Emitted when a current user is demoted to a regular user. */
        console.log(`You were demoted by ${notification.author}`);
});
