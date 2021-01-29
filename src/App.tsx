import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { VerticalBox, TextInput, Text, Header, Button } from "pakinski-ui"
import { Socket } from "socket.io-client"
import { useCookies } from 'react-cookie';





export const App = ({ auth }) => {




  const [connected, setConnected] = useState(false)
  const [validSession, setValidSession] = useState(false)





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
