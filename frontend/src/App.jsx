import { useEffect, useState } from "react";
import { socket } from "./socket"

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)

  }, [])
  return (
    <>
      <div className="App flex flex-col">
      </div>
      <button onClick={() => {
        socket.emit("testEvent")
      }}>testEvent</button>

    </>
  )
}

export default App
