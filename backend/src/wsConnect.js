import mongoose from "mongoose";
import WebSocket from 'ws';

import {UserModel, MessageModel, ChatBoxModel} from "./models/chatbox";

const sendData = (data, wsSet) => {

    // console.log('type of wsSet:', typeof(wsSet));
    // console.log('wsSet:', wsSet);

    if( Object.getPrototypeOf(wsSet) === Set.prototype ){
        //對 set 中的每個 ws 進行迭代
        for (let item of wsSet){
            item.send(JSON.stringify(data)); 
        }
        // console.log('case 1');
    }
    else{
        wsSet.send(JSON.stringify(data)); 
        // console.log('case 2');

    }

    console.log('Data send success.')
}
const sendStatus = (payload, ws) => {
    sendData(["status", payload], ws); 
}

// Create Chatroom ID
const makeName = (name, friend) => {
    return [name, friend].sort().join('_');
}

// Check ChatRoom exists or not
const validateChatBox = async (chatRoomName, name, friend) => {
    let box = await ChatBoxModel.findOne({ name: chatRoomName });
    console.log("box:", box);
    console.log("chatBoxName:", chatRoomName);

    const myId = await UserModel.findOne({name: name});
    const friendId = await UserModel.findOne({name: friend});
    // if not exist -> create a chatbox model.
    if (!box)
        // 要先有users ObjectId.
        console.log('ChatBoxModel不存在 -> 建立ChatBoxModel');
        box = await new ChatBoxModel({ name: chatRoomName, users: [myId._id, friendId._id] }).save();
        await myId.updateOne({"$push": {chatBoxes: box._id}});
        await friendId.updateOne({"$push": {chatBoxes: box._id}});

    return box.populate(["users", {path: 'messages', populate: 'sender' }]);
    // return [{user, sender}];
}

// Create Users
const makeUsers = async (myName, friend) => {
    console.log('User names', myName, friend);
    let user1 = await UserModel.findOne({name: myName})
    let user2 = await UserModel.findOne({name: friend})

    if(!user1){
        user1 = await new UserModel({name: myName}).save()
    }
    
    if(!user2){
        user2 = await new UserModel({name: friend}).save()
    }
    console.log("Users_id ",[user1._id, user2._id])
}


// 建立一個 dictionary of { chatBoxName, Set<ws> }, -> key: value -> "chatBoxName": set(ws...)
// 可以從 chatbox name 找到當前有哪些 websockets / ChatRooms 
// 有這個名字的 chatbox 且為 active
const chatBoxes = {};

export default {
    // 解析client傳來的資料
    onMessage: (wss, ws) => (
        async (byteString) => {
            const { data } = byteString
            const [ task, payload ] = JSON.parse(data)
            const { name, friend } = payload;
            
            // user(ws) was in another chatbox
            if (ws.box !== "" && chatBoxes[ws.box]){
                chatBoxes[ws.box].delete(ws);
            }
            // ws 因故關閉
            ws.once('close', () => {
                chatBoxes[ws.box].delete(ws);
            })

            // create Chatroom ID
            let chatBoxName = makeName( name, friend );
            ws.box = chatBoxName;

            // Create Users
            if(name !== undefined){
                await makeUsers(name, friend);
            }
            // console.log(typeof(participantsID));

            // check ChatRoom exists or not
            console.log('Validation of chat box:', (await validateChatBox(chatBoxName, name, friend)));
            // console.log( validateChatBox(chatBoxName, participants) );

            // ws dict
            // 如果不曾有過 chatBoxName 的對話，將 chatBoxes[chatBoxName] 設定為 empty Set
            if (!chatBoxes[chatBoxName]){
                console.log("Chat Box 不存在，創建chatRoom")
                chatBoxes[chatBoxName] = new Set(); // make new record for chatbox
            }
            // 將 ws client 加入 chatBoxes[chatBoxName] 
            chatBoxes[chatBoxName].add(ws); // add this open connection into chatbox


            switch (task) {
                case 'Init':{
                    // 把這個 chatbox 的 messages 抓下來
                    const chatBoxObject = await ChatBoxModel.findOne({name: chatBoxName});
                    const messages = await MessageModel.find({chatBox: chatBoxObject._id}).populate('chatBox').populate('sender');
                    try{
                        sendData(['Init', messages, chatBoxName], ws);
                        sendStatus({    // {['status',{type, msg}]}
                            type: "success",
                            msg: "Successfully Open one Chatroom",
                        }, ws)
                    }catch(e){throw new Error("Message sending is failed: " + e)}
                    break;
                }

                case 'input': {
                    const { body } = payload
                    // Save message to DB
                    const chatBoxObject = await ChatBoxModel.findOne({name: chatBoxName});
                    const senderObject = await UserModel.findOne({name: name});
                    console.log('Ids:', chatBoxObject._id, senderObject._id);
                    const message = await new MessageModel({ chatBox: chatBoxObject._id, sender: senderObject._id, body: body }).save();
                    // const message = await new MessageModel({ body: body }).save();
                    
                    try { 
                        await ChatBoxModel.findOneAndUpdate({ name: chatBoxName }, { "$push": { "messages": message._id } }, { new: true });
                        
                        // Respond to Sender
                        ( await (await message.populate("chatBox")).populate("sender"));
                        // sendData(['backToSender', message, chatBoxName], ws) // ['backToSender', message]
                        // sendStatus({    // {['status',{type, msg}]}
                        //     type: "success",
                        //     msg: "Successfully sent one message",
                        // }, ws)
    
                        // Respond to Receiver
                        sendData(['backToReceiver', message, chatBoxName], chatBoxes[chatBoxName]);
                        sendStatus({
                            type: 'success',
                            msg: "Successfully receive one message",
                        }, chatBoxes[chatBoxName]);
                    } 
                    catch (e) { throw new Error("Message sending is failed: " + e);
                    }
                    break;
                }
                default: break;
                // cases : ...
            }
        }
    )
}