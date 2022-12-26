import { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { Button, Input, Tag, Tabs } from 'antd';
import Title from "../Components/Title"
import Message from "../Components/Message";
import ChatModal from "../Components/ChatModal";
import { useChat } from "../Hooks/useChat";

const Chatroom = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 500px;
    margin: auto;
`

const ChatBoxesWrapper = styled.div`
    width: 100%;
    height: 300px;
    background: #eeeeee52;
    border-radius: 10px;
    margin: 20px;
    padding: 20px;
    overflow: auto; 
`;

const FootRef = styled.div`
    height: 20px;
`

// Define WebSocket client side 
const client = new WebSocket('ws://localhost:4000');

const ChatRoom = () => {

    // States
    const {status, me, messages, currentBoxName, setStatus, setMessages, sendMessage, setCurrentBoxName, clearMessages, displayStatus, startChat} = useChat();
    // const [username, setUsername] = useState('');
    const [body, setBody] = useState('');  // text body
    const bodyRef = useRef(null);
    // New States
    const [msgSent, setMsgSent] = useState(false);
    const [chatBoxes, setChatBoxes] = useState([]);
    const [activeKey, setActiveKey] = useState("");
    const [modalOpen, setModalOpen] = useState(false);


    // Refs
    const msgFooter = useRef(null);
    

    // Functions

    // New Functions
    const scrollToBottom = () => {
        msgFooter.current?.scrollIntoView({ behavior: 'smooth', block: "start" });
        console.log("Scroll!", msgFooter.current)
    }
    
    useEffect(() => {
        scrollToBottom();
        setMsgSent(false);
    }, [msgSent]);

    // Show Messages in the chatbox
    const displayMessages = (Chat) => { // [{name, body}, {}, ..., {}]
        return(
            (Chat.length === 0 ? 
            ([<p style={{ color: '#ccc' }}>No messages...</p>]) :
            ((Chat.map(({chatBox, sender, body}, i) => (
                <Message isMe={me === sender.name} message={body} />)))
            )
            )
        );
    }

    const renderChat = (chat) => {
        return(displayMessages(chat));
    }

    const extractChat = (friend) => {
        console.log('messages:', messages);
        return renderChat(
            messages.filter(({sender}) => ((sender?.name === friend) || (sender?.name === me)))
        );
    } 
    
    const InitChatBox = (chatBoxName) => {
        const currentChatBox = chatBoxes.find(({key}) => key === activeKey);
        if(currentChatBox){

            console.log('Successfully find chatbox', currentChatBox);
    
            currentChatBox.children = [
                ...renderChat(messages.filter(({chatBox}) => (chatBox?.name === chatBoxName))), 
                <FootRef ref={msgFooter}></FootRef>
            ]
            // if(currentChatBox.children.length === 1){

            //     currentChatBox.children.push(<FootRef ref={msgFooter}></FootRef>)
            //     setMsgSent(true);
            // }
        }
    }

    // const InputMessage = (payload) => {
    //     const currentChatBox = chatBoxes.find(({key}) => key === activeKey);
    //     if(currentChatBox){

    //         console.log('Successfully find chatbox', currentChatBox);
    
    //         currentChatBox.children = [...currentChatBox.children, <Message isMe={me === payload.sender.name} message={payload.body} />];
    //     }
    // }

    useEffect(() => {
        if(true){
            InitChatBox(currentBoxName);
        }
    }, [messages]);

    // useEffect(() => {
    //     // try {
    //     //     const currentChatBox = chatBoxes.find(({key}) => key === activeKey);
    //     //     console.log('Successfully find chatbox', currentChatBox);

    //     //     if(currentChatBox){
    //     //         currentChatBox.children = extractChat(activeKey);
    //     //     }
    //     // }catch(e){
    //     //     console.log(e);
    //     // }
    // }, [status]);

    // Tabs: addition and deletion
    const removeChatBox = (targetKey) => {
        const index = chatBoxes.findIndex(({key}) => key === activeKey);
        const newChatBoxes = chatBoxes.filter(({key}) => key !== targetKey);
        setChatBoxes(newChatBoxes);
        return(
            activeKey ?
                activeKey === targetKey ?
                    index === 0 ?
                        " " : chatBoxes[index - 1].key
                : activeKey
            : ""        
        )
    }
    // Create a chat box.
    const createChatBox = (friend) => {
        if(chatBoxes.some(({key}) => key === friend)){
            throw new Error(friend + " 's chat box has already opened.");
        }
        // 提取與該朋友的聊天記錄
        const chat = extractChat(friend);
        setChatBoxes([
            ...chatBoxes,
            {
                label: friend,
                // children: [chat, <FootRef ref={msgFooter}></FootRef>],
                children: chat,
                key: friend,
            }
        ])
        setMsgSent(true); // -> trigger scrollToBottom()
        return friend;
    }

    // WebSocket
    // const client = new WebSocket('ws://localhost:4000');
    client.onopen = () => {
        console.log("WebSocket client side is connected.")
    }
    // const sendData = async(data) => {
    //     await client.send(JSON.stringify(data));
    // }
    client.onmessage = (byteString) => {
        const {data} = byteString; // 拿出資料裡面的data屬性。
        const [task, payload, chatBoxName] = JSON.parse(data); // ['', {}]
        switch(task){
            case "Init":{
                setMessages(payload);
                setCurrentBoxName(chatBoxName);
                // InitChatBox(chatBoxName);
                console.log('Init payload:', payload);
                break;
            }
            
            // case 'backToSender':{
            //     console.log('Message Content: ', payload);
            //     setMessages([...messages, payload]);
            //     // InputMessage(payload);
            //     // setMsgSent(true);
            //     console.log(messages);
            //     break;
            // }

            case 'backToReceiver':{
                console.log('Receiver\'s Message  Content: ', payload);
                setMessages([...messages, payload]);
                setMsgSent(true);
                // console.log(messages);
                break;
            }

            case "cleared":{
                setMessages([]);
                break;
            }
            case "status":{
                setStatus(payload);
                break;
            }
            default: break;    
        }
    }



    return(
        <Chatroom>
            <Title name={me}>
                <Button type="primary" danger onClick={clearMessages}>
                    Clear
                </Button>
            </Title>
            <ChatBoxesWrapper>
                <Tabs
                    type="editable-card"
                    onChange={(key) => {
                        setActiveKey(key);
                        // extractChat(key);
                        startChat({name: me, friend: key});
                        setMsgSent(true);
                    }}
                    onEdit={(targetKey, action) => {
                        if (action === 'add') {
                            setModalOpen(true);
                        }
                        else if (action === 'remove') {
                            setActiveKey(removeChatBox(targetKey, activeKey));
                        }
                    }}
                    items={chatBoxes} // Messages Content
                    >
                    {/* {displayMessages()} */}
                    {/* <FootRef ref={msgFooter}></FootRef> */}
                </Tabs>
            </ChatBoxesWrapper>
            <ChatModal
                open={modalOpen}
                onCreate={({ name }) => {
                    // 按下 Create 後的動作
                    setActiveKey(createChatBox(name)); // create new Tab and return friend's name as ActiveKey
                    // extractChat(name);
                    startChat({name: me, friend: name}); // Notice backend
                    setModalOpen(false);
                }}
                onCancel={() => { setModalOpen(false);}}
            />
            {/* <Input
                placeholder="Username"
                style={{ marginBottom: 10 }}
                value={username}
                onChange={(e) => {setUsername(e.target.value)}}
                onKeyDown={(e) => {
                    if(e.key === 'Enter'){bodyRef.current.focus();}
                }}
            ></Input> */}
            <Input.Search
                ref={bodyRef}
                enterButton="Send"
                placeholder="Type a message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onSearch={(msg) => {
                    // Make sure is not empty
                    if(!msg){
                        displayStatus({
                            type: 'error',
                            msg: 'Please enter a username and a message body.'
                        })
                        return;
                    }
                    sendMessage({name: me, friend: activeKey, body: msg});
                    setMsgSent(true);
                    setBody(''); // 清空Body內容
                    
                }}
            ></Input.Search>
        </Chatroom>
    )
}

// export default ChatRoom;
export { ChatRoom, client }