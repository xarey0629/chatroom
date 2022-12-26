import { useState, useEffect, createContext, useContext } from "react";
import { message } from 'antd';
import { client } from '../Containers/ChatRoom';

const ChatContext = createContext({
    status: {},
    me: "",
    signedIn: false,
    messages: [],
    currentBoxName: "",
    setStatus: () => {},
    setMe: () => {},
    setSignedIn: () => {},
    setMessages: () => {},
    setCurrentBoxName: () => {},
    sendMessage: () => {},
    clearMessages: () => {},
    displayStatus: () => {},
    startChat: () => {},
    sendData: () => {},
})

const ChatProvider = (props) => {

    // 11/18 Added
    const LOCALSTORAGE_KEY = "save-me";
    const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);
    // States
    const [status, setStatus] = useState("");
    const [me, setMe] = useState(savedMe || "");
    const [signedIn, setSignedIn] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentBoxName, setCurrentBoxName] = useState("");

    useEffect(() => {
        if(signedIn){
            localStorage.setItem(LOCALSTORAGE_KEY, me);
        }
    }, [me, signedIn]);

    // Functions
    const sendData = async(data) => {
        await client.send(JSON.stringify(data));
    }

    const sendMessage = (payload) => {
    
        // Update messages and status
        // setMessages(
        //     [
        //     ...messages,
        //     payload
        //     ]
        // )
    
        // setStatus({
        //     type: "success",
        //     msg: "Message sent."
        // })

        // include three main characters -> 包在payload裡頭？ payload: {name: me, friend: activeKey, body: msg}
        // sender chatBox body
        sendData(["input", payload]);
        // console.log(payload);
    }

    const clearMessages = () => {
        // setMessages([]);

        // 隸屬於哪個chatBox的messages
        sendData(["clear"]);
        // console.log("Send clear request.");
    };

    const displayStatus = (s) => {
        if(s.msg){
          const {type, msg} = s; //解構賦值
          const content = {
            content:msg , duration: 0.5
          }
          switch(type){
            case "success" :
              message.success(content)
              break;
            case "error" :
            default:
              message.error(content)
              break;
          }
        }
    }
    
    useEffect(() => {
      displayStatus(status)
    }, [status]);

    const startChat = (payload) => {
        // payload = [name, to]
        sendData(['Init', payload]);
    } 

    return(
        <ChatContext.Provider
            value={{
                status, 
                me, 
                signedIn, 
                messages, 
                currentBoxName,
                setStatus, 
                setMe, 
                setSignedIn, 
                setMessages, 
                setCurrentBoxName,
                sendMessage, 
                clearMessages, 
                displayStatus,
                startChat,
                sendData,
            }}
            {...props}
        />
    )

}

const useChat = () => useContext(ChatContext);

export {ChatProvider, useChat};

    // ------------------------------------------

//    const [messages, setMessages] = useState([]);
//    const [status, setStatus] = useState({});
//     // 與後端建立ws連結
//    const client = new WebSocket('ws://localhost:4000');
//    // 前端接收資料(onmessage), define client.onmessage()
//    client.onmessage = (byteString) => {
//     const {data} = byteString;
//     const [task, payload] = JSON.parse(data); // ['', {}]
//     switch(task){
//         case "init":{
//             setMessages(payload);
//             break;
//         }
//         case "output":{
//             setMessages(
//                 [
//                     ...messages,
//                     ...payload
//                 ]
//             );
//             break;
//         }
//         case "status":{
//             setStatus(payload);
//             break;
//         }
//         case "cleared":{
//             setMessages([]);
//             break;
//         }
//         default: break;    
//     }
//    }

//    // send data to backend
//    const sendData = async(data) => {
//     await client.send(JSON.stringify(data));
//    }

//    const sendMessage = (payload) => {
    
//         // update messages and status
//         // setMessages(
//         //     [
//         //     ...messages,
//         //     payload
//         //     ]
//         // )
    
//         // setStatus({
//         //     type: "success",
//         //     msg: "Message sent."
//         // })

//         sendData(["input", payload]);
//         console.log(payload);
//     }

//     const clearMessages = () => {
//         sendData(["clear"]);
//         console.log("Send clear request.");
//     };

// return {
//     status, messages, sendMessage, clearMessages
// };
// };

// export default useChat;