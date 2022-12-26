import Title from "../Components/Title";
import LogIn from "../Components/Login";
import { useChat } from "../Hooks/useChat";

const SignIn = () => {
    const { me, setMe, setSignedIn, displayStatus } = useChat();

    //

    const handleLogin = (name) => {

        if(!name){
            displayStatus({
                type: "error",
                msg: "Missing user name",
            });
        }
        else{
            setSignedIn(true);
        }
    }

    return(
        <>
            <Title />
            <LogIn me={me} setName={setMe} onLogin={handleLogin}/>
        </>
    )
    
}

export default SignIn;