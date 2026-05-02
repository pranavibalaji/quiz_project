import { io } from "socket.io-client";

const socket = io("http://192.168.0.7:5001", {
  autoConnect: true,
});

export default socket;