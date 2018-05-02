
require('./Database');
require('./Entity');
require('./client/Inventory');

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 3000);
console.log("Server started.");

var SOCKET_LIST = {};

console.log(SOCKET_LIST);

var DEBUG = true;
 

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	socket.on('signIn',function(data){ 
		Database.isValidPassword(data,function(res){
			if(!res)
				return socket.emit('signInResponse',{success:false});

                Database.getPlayerType(data.username,function(progress){
                    Player.onConnect(socket,data.username, progress);
                        socket.emit('signInResponse',{success:true, progress:progress});
                })
		});
        Database.leaderBoard(function(leaderboard){
            var leaderBoard = [];
            for(i = 0; i < leaderboard.length; i++){
                var x = leaderboard[i].username + ": " + leaderboard[i].xp;
                leaderBoard[i] = x; 
                console.log(leaderBoard[i]);
            }
            console.log(leaderBoard);
            socket.emit('leaderboard', {leaderb:leaderBoard});
        });

	});
    
    socket.on('refreshLeaderbaord', function(){
        Database.leaderBoard(function(leaderboard){
            var leaderBoard = [];
            for(i = 0; i < leaderboard.length; i++){
                var x = leaderboard[i].username + ": " + leaderboard[i].xp;
                leaderBoard[i] = x; 
                console.log(leaderBoard[i]);
            }
            console.log(leaderBoard);
            socket.emit('leaderboard', {leaderb:leaderBoard});
        });
    });
	socket.on('signUp',function(data){
		Database.isUsernameTaken(data,function(res){
			if(res){
				socket.emit('signUpResponse',{success:false});		
			} else {
				Database.addUser(data,function(){
					socket.emit('signUpResponse',{success:true});					
				});
			}
		});		
	});
	
    socket.on('mage',function(data){
		Database.updatePlayerType(data,function(res){
            if(res){
                console.log("mage");
            }
            else{
                console.log("garbage");
            }
		});		
	});
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
	
	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer',res);		
	});
	
	
	
});

setInterval(function(){
	var packs = Entity.getFrameUpdateData();
    Entity.getSockets(SOCKET_LIST);
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',packs.initPack);
		socket.emit('update',packs.updatePack);
		socket.emit('remove',packs.removePack);
	}
	
},1000/25);







