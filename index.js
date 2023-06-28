// first import install libery 

const express = require("express");
var bodyParse = require("body-parser");
var mongoose = require("mongoose");
const e = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
require("dotenv").config();
const { createClient } = redis;
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

//create app

const app = express()
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(path.join(__dirname, "public")));

// chat application


// Set static folder

const botName = "Pikadex Chat";

// Run when client connects
io.on("connection", (socket) => {
  console.log(io.of("/").adapter);
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("messages", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});


//=================================================

app.use(bodyParse.json())
app.use(express.static('public'))
app.use(bodyParse.urlencoded({
    extended: true
}))

// conect database


mongoose.connect('mongodb://0.0.0.0:27017/mydb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

var db = mongoose.connection;

// check connect

db.on('error', () => console.log("error in connecting database"));
db.once('open', () => console.log("Connected to Database"));


app.get("/", (req, res) => {

    res.set({
        "Allow-access-Allow-Origin": '*'
    })

    return res.redirect('index.html');

});

//=============================================
app.post("/login", async (request, response) => {
    try {
        //adding get data from login_up.html
        const username = request.body.username;
        const password = request.body.password;

        console.log(`${username} and ${password}`);

        const usermail = db.collection('users').findOne({ email: username }, (err, res) => {
            if (res == null) {
                response.send("Invalid information!❌❌❌! Please create account first");
            }
            else if (err) throw err;


            if (res.password == password) {
                return response.redirect('index.html');
            }
            else {
                response.send("Invalid Password!❌❌❌");
            }


        });
    }
    catch (error) {
        response.send("Invalid information❌");
    }

})

//Create Object

app.post("/sign_up", (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var phno = req.body.phno;
    var password = req.body.password;
    var dob = req.body.dob;
    var gender = req.body.gender;
    var aadhar = req.body.aadhar;
    var pancard = req.body.pancard;
    var location = req.body.location;
    var message = req.body.message;
    var address = req.body.address;
    var data = {
        "name": name,
        "email": email,
        "phno": phno,
        "password": password,
        "dob": dob,
        "gender": gender,
        "aadhar": aadhar,
        "pancard": pancard,
        "location": location,
        "message": message,
        "address": address
    }

    //sent database
    db.collection('users').insertOne(data, (err, collection) => {
        if (err) throw err;
        console.log("Record Inserted Successfully");
    });
    return res.redirect('userlogin.html');

})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));