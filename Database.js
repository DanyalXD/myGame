
var mongojs = require("mongojs");
var db =mongojs('localhost:27017/webDev', ['account','progress']);


//Valid user
Database = {};
Database.isValidPassword = function(data,cb){
	db.account.findOne({username:data.username,password:data.password},function(err,res){
		if(res)
			cb(true);
		else
			cb(false);
	});
}
//Check if user taken
Database.isUsernameTaken = function(data,cb){
	db.account.findOne({username:data.username},function(err,res){
		if(res)
			cb(true);
		else
			cb(false);
	});
}
Database.addUser = function(data,cb){
    var xp = 0;
    console.log(xp);
    db.account.insert({username:data.username,password:data.password},function(err){
        Database.setXp({username:data.username, xp:0}, function(){
            cb();
        })
	});
}

//update Player type
Database.updatePlayerType = function(data,cb){
    cb = cb || function(){}
    console.log(data.playertype);
    db.progress.update({username:data.username},{$set:{playertype:data.playertype}});
}

//set xp
Database.setXp = function(data,cb){
    cb = cb || function(){}
    db.progress.insert({username:data.username, xp:data.xp, playertype:null});
}

//update xp
Database.addXp = function(data,cb){
    cb = cb || function(){}
    db.progress.update({username:data.username},{$set:{xp:data.xp}});
}

//get player type
Database.getPlayerType = function(username,cb){
	db.progress.find({username:username},function(err,res){
        if(res.length > 0){
            cb(res);
        }
        else{
            cb(false);
        }
	});
}

//update leaderboard
Database.leaderBoard = function(cb){
	db.progress.find().sort( { xp: -1 },function(err,res){
        if(res.length > 0){
            cb(res);
        }
        else{
            cb(false);
        }
	});
}