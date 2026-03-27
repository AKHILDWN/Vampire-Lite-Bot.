const login = require("fb-chat-api");
const fs = require("fs");

const MY_ID = "61567276533610"; // Yuvi ki ID
const PREFIX = "#";
let lockedName = ""; 
let isNameLocked = false;

const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));

login({appState}, (err, api) => {
    if(err) return console.error("Login Error!", err);

    api.setOptions({listenEvents: true, selfListen: false});
    console.log("Bot is ONLINE, Yuvi!");

    api.listenMqtt((err, event) => {
        if(err) return;

        // --- 1. NAME LOCK PROTECTION LOGIC ---
        if (event.type === "event" && event.logMessageType === "log:thread-name") {
            if (isNameLocked && event.author !== api.getCurrentUserID()) {
                // Agar koi naam badle, toh bot turant wapas lock wala naam set karega
                api.setTitle(lockedName, event.threadID);
            }
        }

        // --- 2. COMMANDS (ONLY FOR YUVI) ---
        if (event.type === "message" && event.body && event.body.startsWith(PREFIX)) {
            if (event.senderID !== MY_ID) return; // Dusron ki command ignore

            const args = event.body.slice(PREFIX.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            // Command: #namelock on [Name]
            if (command === "namelock") {
                if (args[0] === "on") {
                    isNameLocked = true;
                    lockedName = args.slice(1).join(" ");
                    api.setTitle(lockedName, event.threadID);
                    api.sendMessage(`✅ Name Lock ON: ${lockedName}`, event.threadID);
                } else if (args[0] === "off") {
                    isNameLocked = false;
                    api.sendMessage("❌ Name Lock OFF", event.threadID);
                }
            }

            // Command: #setall [Nickname]
            if (command === "setall") {
                const nick = args.join(" ");
                api.getThreadInfo(event.threadID, (err, info) => {
                    if(err) return;
                    info.participantIDs.forEach(id => {
                        api.changeNickname(nick, event.threadID, id);
                    });
                });
                api.sendMessage(`🔥 Sabka naam '${nick}' kar diya!`, event.threadID);
            }
        }
    });
});
