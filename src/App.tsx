import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { VerticalBox, HorizontalBox, Subtitle, TextInput, Text, Header, Button } from "pakinski-ui"
import { Socket } from "socket.io-client"
import { useCookies } from 'react-cookie';
import Moment from 'react-moment';






export const App = ({ auth }) => {

  const [connected, setConnected] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [roomID, setRoomID] = useState("")

  const [cookies, setCookies, deleteCookie] = useCookies(["auth", "username"])

  useEffect(() => {

    auth.on("connect", () => {
      console.log("connection established")
      setConnected(true)
    })




  }, [])





  const authenticate = () => {



  }






  //attempt to reconnect if lost connection to server
  useEffect(() => {


    //connected, checking 


    if (!connected) { return console.log("not connected") }
    console.log("connection to server established")

    let reconnectFailed = false

    if (cookies.auth) {

      console.log("auth cookie detected, attempting to reconnect")


      auth.emit("reconnect", cookies.auth, (res) => {

        let { status, message } = res

        console.log(res)

        if (status === 1) {

          setConnected(true)
          setValidSession(true)

          console.log(message)
          return

        } else {
          console.log('reconnect failed')
          deleteCookie("auth")
          deleteCookie("username")
          reconnectFailed = true
        }

      })

    }

  }, [connected])


  if (!validSession) return <AuthScreen auth={auth} setCookies={setCookies} setValidSession={setValidSession} />
  if (validSession && roomID === "") return <Lobby setRoomID={setRoomID} auth={auth} />
  if (validSession && roomID !== "") return <Room auth={auth} roomID={roomID} />

  return (
    <VerticalBox>

      <Header>{connected ? "Connected to server" : "Not connected to Server"}</Header>

      <Header>Welcome {cookies.username}</Header>


    </VerticalBox>
  );
}



const AuthScreen = ({ auth, setCookies, setValidSession }) => {


  const [authErr, setAuthErr] = useState("")
  const [text, setText] = useState("")



  const connect = () => {

    if (text.length === 0) return setAuthErr("Cannot be empty")

    auth.emit("authenticate", text, (res) => {

      let { status, message, authCookie, username } = res

      if (status === 0) {
        setText("")
        return setAuthErr(message)
      }

      setCookies("auth", authCookie)
      setCookies("username", username)
      setValidSession(true)

    })

  }

  return <VerticalBox horizontalSpacing={'center'} height={"100vh"} verticalSpacing={'center'}>

    <VerticalBox width={"30rem"} >
      <Text color="red" margin={'1rem'}>{authErr}</Text>
      <br />
      <TextInput onChange={e => setText(e.target.value)} value={text} placeholder="input a username" fill={true} />
      <Button fill={true} onClick={() => connect()}>Connect</Button>
    </VerticalBox>



  </VerticalBox >

}



const Lobby = ({ auth, setRoomID }) => {



  const [looking, setLooking] = useState(false)

  const lookForMatch = () => {
    auth.emit("matchmaking", (res) => {

      let { status, message } = res

      if (status === 0) return console.log(message)

      setLooking(true)


    })
  }

  useEffect(() => {

    auth.on("match-found", (roomID: string) => {
      setRoomID(roomID)
    })


  }, [])



  return <VerticalBox horizontalSpacing={'center'} height={"100vh"} verticalSpacing={'center'}>

    <VerticalBox width={"30rem"} >
      <br />
      {!looking ? <Button fill={true} onClick={() => lookForMatch()}>Start Matchmaking</Button> : <Header>Looking for match</Header>}

    </VerticalBox>



  </VerticalBox >

}



const Room = ({ auth, roomID, }) => {


  console.log("render")

  const lastUpdate = useRef(0);
  const typingTimeout = .5;

  const [text, setText] = useState("")
  const [typing, setTyping] = useState(false);
  const [strangerTyping, setStrangerTyping] = useState(false);

  const [chats, setChats] = useState([])
  let [cookies, setCookies] = useCookies(["cookie", "username"])




  const timeSort = (a, b) => {
    return b.timestamp - a.timestamp
  }

  useEffect(() => {

    const typeChecker = setInterval(() => {
      const now = +new Date();

      const delta = (now - lastUpdate.current) / 1000;

      if (delta > typingTimeout) {
        setTyping(false);
      }
    }, 1000);

  }, [])

  //send the typing message
  useEffect(() => {
    // sendTyping();


    auth.emit("typing", {
      roomID,
      typing,
    })


  }, [typing]);


  useEffect(() => {



    auth.on("chat", (data) => {

      // copy.sort(timeSort)

      setChats(prevChat => {

        let copy = [...prevChat]
        copy.push(data)
        copy.sort(timeSort)

        return copy

      })

      // console.log(`${username}: ${message}`)


    })

    auth.on("typing", (data) => {

      let { username, typing, timestamp } = data;

      if (typing) console.log(`${username} is typing`)
      else console.log(`${username} stopped typing`)

      setStrangerTyping(typing)


    })

  }, [])

  const updateText = (e) => {
    setText(e.target.value);
    //set typing to true
    setTyping(true);
    //update last typed
    lastUpdate.current = +new Date();
    console.log(chats)

  };

  const sendChat = () => {

    if (text === "") return

    auth.emit("chat", {
      roomID,
      message: text,
    })

    setText("")
    setTyping(false)

  }



  const renderChats = chats.map((chat, index) => {

    console.log(`${chat.username}:${index}:${chat.message}`)
    return <HorizontalBox style={{ flexDirection: cookies.username === chat.username ? "row-reverse" : "row" }} margin={".2rem 1rem"} key={`${chat.username}:${index}:${chat.message}`}>

      <VerticalBox verticalAlignment="space-between" padding="1rem" style={{ border: '1px solid', borderRadius: '.4rem', maxWidth: "50%" }}>

        <Text>{chat.message}</Text>
        <Text size={0.4}></Text>

        <Text style={{ margin: 0, padding: 0, transform: "translate(0rem, .3rem)" }} size={0.6} color="#acacac">
          {new Date(chat.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Text>
        {/* <Text>{chat.timestamp}</Text> */}
      </VerticalBox>

    </HorizontalBox>



  })





  return <VerticalBox horizontalSpacing={'center'} height={"100vh"} verticalSpacing={'center'}>

    <VerticalBox width={"30rem"} >
      <br />
      <Header>{strangerTyping ? "Stranger is typing" : "Stranger"}</Header>

      <VerticalBox padding={'1rem 0'} style={{ overflowY: "scroll", flexDirection: 'column-reverse', border: '1px solid', borderRadius: '.2rem', color: '#ddd' }} height={"40rem"}>


        {renderChats}


      </VerticalBox>

      <HorizontalBox>
        <TextInput
          value={text}
          onChange={(e) => updateText(e)}
          placeholder="message"
        />
        <Button primary={true} onClick={() => sendChat()}>
          Send
          </Button>
      </HorizontalBox>

    </VerticalBox>



  </VerticalBox >

}

