

var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};
var SOCKET_LIST = {};

//Initial Setup
Entity = function(param){
	var self = {
		x:250,
		y:250,
		spdX:0,
		spdY:0,
		id:"",
		map:'forest',
	}
	if(param){
		if(param.x)
			self.x = param.x;
		if(param.y)
			self.y = param.y;
		if(param.map)
			self.map = param.map;
		if(param.id)
			self.id = param.id;		
	}
	
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}
//Update Frames
Entity.getFrameUpdateData = function(){
	var pack = {
		initPack:{
			player:initPack.player,
			bullet:initPack.bullet,
		},
		removePack:{
			player:removePack.player,
			bullet:removePack.bullet,
		},
		updatePack:{
			player:Player.update(),
			bullet:Bullet.update(),
		}
	};
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
	return pack;
}

//Get users online
Entity.getSockets = function(data){
   SOCKET_LIST = data;
}

//Create Player
Player = function(param){
	var self = Entity(param);
	self.number = "" + Math.floor(10 * Math.random());
	self.username = param.username;
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.pressingAttack = false;
    self.prssingUlti = false;
	self.mouseAngle = 0;
	self.maxSpd = 10;
	self.hp = 200;
	self.hpMax = 200;
    self.ultiUp = true;
    self.xp = param.progress[0].xp
    self.playertype = param.progress[0].playertype;

	
	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		
		super_update();
		
		if(self.pressingAttack){
            self.shootBullet(self.mouseAngle);
		}
	//Ultimate Ability
        if(self.pressingUlti){
            if(self.playertype == 'mage'){
                if(self.ultiUp == true){
                    for(var i = 0 ; i < 360; i++)
                        self.shootBullet(i);
            
            
                    self.ultiUp = false;  
                    cd();
                }
		//cooldown
                function cd(){
                     var coolDown = setInterval(function(){
                            self.ultiUp = true;
                            clearInterval(coolDown);
                    }, 20000);
                }
            }
            else{
                    if(self.ultiUp == true){
                    self.hp += 1000;

                    console.log(self.hp);
                    var timesRun = 0;
                    var interval = setInterval(function(){
                        timesRun += 1;
                        if(timesRun == 1){
                            self.hp -= 1000;
                            self.ultiUp = false;
                            clearInterval(interval);
                            cd();
                        }
                    }, 3000);
                    function cd(){
                        var coolDown = setInterval(function(){
                            self.ultiUp = true;
                            clearInterval(coolDown);
                        }, 20000);
                    }
                    }
            }
                

	}
    }
	//shoot bullet
	self.shootBullet = function(angle){
            Bullet({
                parent:self.id,
                angle:angle,
                x:self.x,
                y:self.y,
                map:self.map,
            });
	}
	
	self.updateSpd = function(){
		if(self.pressingRight)
			self.spdX = self.maxSpd;
		else if(self.pressingLeft)
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;
		
		if(self.pressingUp)
			self.spdY = -self.maxSpd;
		else if(self.pressingDown)
			self.spdY = self.maxSpd;
		else
			self.spdY = 0;		
	}
	
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,	
			number:self.number,	
			hp:self.hp,
			hpMax:self.hpMax,
			score:self.score,
			map:self.map,
		};		
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			hp:self.hp,
			score:self.score,
			map:self.map,
		}	
	}
	
	Player.list[self.id] = self;
	
	initPack.player.push(self.getInitPack());
	return self;
}
//Player Connect
Player.list = {};
Player.onConnect = function(socket,username,progress){
	var map = 'forest';
	var player = Player({
		username:username,
		id:socket.id,
		map:map,
		socket:socket,
		progress:progress,
	});
	//On Key Press
	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
        else if(data.inputId === 'ulti')
			player.pressingUlti = data.state;
		else if(data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if(data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
	});
	//Change Room
	socket.on('changeMap',function(data){
		if(data.map)
			player.map = data.map;
	});
    
	//Messaging
	socket.on('sendMsgToServer',function(data){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',player.username + ': ' + data);
		}
	});
	socket.on('sendPmToServer',function(data){ 
		var recipientSocket = null;
		for(var i in Player.list)
			if(Player.list[i].username === data.username)
				recipientSocket = SOCKET_LIST[i];
		if(recipientSocket === null){
			socket.emit('addToChat','The player ' + data.username + ' is not online.');
		} else {
			recipientSocket.emit('addToChat','From ' + player.username + ':' + data.message);
			socket.emit('addToChat','To ' + data.username + ':' + data.message);
		}
	});
	
	socket.emit('init',{
		selfId:socket.id,
		player:Player.getAllInitPack(),
		bullet:Bullet.getAllInitPack(),
	})
}
Player.getAllInitPack = function(){
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}

Player.onDisconnect = function(socket){
	let player = Player.list[socket.id];
	if(!player)
		return;
	Database.addXp({
		username:player.username,
		xp:player.xp,
	});
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}
Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());		
	}
	return pack;
}

//create bullet
Bullet = function(param){
	var self = Entity(param);
	self.id = Math.random();
	self.angle = param.angle;
	self.spdX = Math.cos(param.angle/180*Math.PI) * 10;
	self.spdY = Math.sin(param.angle/180*Math.PI) * 10;
	self.parent = param.parent;
	
	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();
		
  
        
		for(var i in Player.list){
			var p = Player.list[i];
			if(self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id){
				p.hp -= 1;		
				if(p.hp <= 0){
					var shooter = Player.list[self.parent];
					if(shooter)
						shooter.xp += 20;
                        console.log(shooter.xp);
                        shooter.map = shooter.username;
                        shooter.hp = shooter.hpMax
                    
                        
					p.hp = p.hpMax;
					p.x = Math.random() * 500;
					p.y = Math.random() * 500;					
				}
				self.toRemove = true;
			}
		}
	}
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			map:self.map,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,		
		};
	}
	
	Bullet.list[self.id] = self;
	initPack.bullet.push(self.getInitPack());
	return self;
}
Bullet.list = {};

Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push(bullet.getUpdatePack());		
	}
	return pack;
}

Bullet.getAllInitPack = function(){
	var bullets = [];
	for(var i in Bullet.list)
		bullets.push(Bullet.list[i].getInitPack());
	return bullets;
}
