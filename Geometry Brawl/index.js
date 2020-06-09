/* Notes

-postgres 'select' function needs '' when comparing WHERE name = 'name u looking for'

*/

const express = require('express')
const app = express();
const session = require('express-session') //npm install express-session
const path = require('path')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');

const http = require('http').Server(app);
const io = require('socket.io')(http, {
  pingTimeout: 60000,
});

const PORT = process.env.PORT || 5000
var name,
    players = {},
    numPlayers;

/////////////////////////Heroku Datasbase connection////////////////////
 const{Pool} = require('pg')
 var pool = new Pool({
   user:"wgenxayxlhlmqa",
   password:"edf88fec7889bc8cd246202f4847e739f2fe8dd672be3e2b2d11d20a4cc78ecd",
   host:"ec2-54-235-163-246.compute-1.amazonaws.com",
   port:5432,
   database:"ddsaml5s5nb13m",
   ssl:true
 })
////////////////////////////////////////////////////////////////////////

/////////////////////////Local Datasbase connection//////////////////////

// const{Pool} = require('pg')
// var pool = new Pool({
//   user:"postgres",
//   password:"", //Enter your pass here
//   host:"localhost",
//   port:5432,
//   database:"" //enter your own database name here
// })

////////////////////////////////////////////////////////////////////////

//////////////////////////DEFAULT STUFF//////////////////////////////////
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')
////////////////////////////////////////////////////////////////////////

/////////////////////////////ADDED CONTENT////////////////////////////////
app.engine('html', require('ejs').renderFile);
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
/////////////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {res.sendFile(path.join(__dirname, 'public/login.html'));}); //allows for login page right away

///////////////////////////Socket Code//////////////////////////////
io.sockets.on('connection', function(socket) {

    var spawnX = 1500,
        spawnY = 1500;
    console.log(socket.id);
    socket.on('randomSpawn', function(x, y){
        spawnX = x;
        spawnY = y;
    });

    players[socket.id] = {
        name:'lol',
        x: spawnX,
        y: spawnY,
        // angle: 0,
        vx: 0,
        vy: 0,
        kills: 0,
        deaths: 0,
        id: socket.id
    }

    io.emit('playerConnect', players[socket.id]); // sending new player info to existing players
    io.emit('newPlayer', {newID: socket.id, playersData: players}); // send existing player data to new player

    socket.on('playerUpdate', function(playerData){
        players[socket.id].x = playerData.x;
        players[socket.id].y = playerData.y;
        players[socket.id].vx = playerData.vx;
        players[socket.id].vy = playerData.vy;
        players[socket.id].angle = playerData.angle;
        io.emit('updateAll', players[socket.id]);
    });

    ///////////////////////////Chat Room Code//////////////////////////////
    socket.on('username', function(username) {
        socket.username = username;
        players[socket.id].name = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat...</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat...</i>');
        io.emit('playerDisconnect', socket.id);
        delete players[socket.id];
    });

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
    });

        ////////Projectile Code
    //Tell everyone connected to create a projectile
    socket.on('projectile_created', function(posx, posy, dx, dy, id) {
        // console.log('test2');
        io.emit('add projectile to world', posx, posy, dx, dy, id);
    });
    //tells all connected clients to update the projecilte position
    socket.on('tell_ppos', function() {
        io.emit('p_update' );
    });

    socket.on('hitPlayer',function(id, bulletId){
        //console.log('second', bulletId);
        io.emit('gotHit',id, bulletId);
    });

    //tells all clients to update the position of dead player
    socket.on('has_died', function(myPlayer, bulletId) {
        players[myPlayer].x = Math.floor(Math.random() * 3000);  //respawn coordinates, may change :o
        players[myPlayer].y = Math.floor(Math.random() * 3000);
        players[bulletId].kills += 1;
        players[myPlayer].deaths += 1;

        pool.query(`UPDATE stats SET kills = kills + 1
                    WHERE username = '${players[bulletId].name}'`, (err,result)=> {

                    });

        pool.query(`UPDATE stats SET deaths = deaths +1
                    WHERE username = '${players[myPlayer].name}'`, (err,result)=> {

                    });

        pool.query(`UPDATE users SET exp = exp + 5
                    WHERE username = '${players[bulletId].name}'`, (err,result)=> {

                    });

        console.log(players[bulletId].name);
        console.log('kills    =    ' + players[bulletId].kills);
        console.log('deaths    =    ' + players[bulletId].deaths);

        console.log(players[myPlayer].name);
        console.log('kills    =    ' + players[myPlayer].kills);
        console.log('deaths    =    ' + players[myPlayer].deaths);




        //console.log('second', bulletId);
        io.emit('respawn :(', players[myPlayer], myPlayer, bulletId);
    });
});








const server = http.listen(PORT, function() {
    console.log('listening on *:' + PORT);
});
///////////////////////////////////////////////////////////////////////





// iogame.on('connection', socket => {
//     socket.on('username', function(username){
//         iogame.emit('message', 'hello');
//         console.log("game socket is working");
//     })
// });

///////////////////////////////////////////////////////////////////////
app.post('/login', (req, res) => {
	var username = req.body.user_name;
	var password = req.body.pass;
    var bannedID = -1;
	if (username && password) {
        pool.query(`select * from users where username = '${username}' and password = '${password}' and type='${bannedID}'`, (err,result) => {
            if(result.rows.length > 0){
                var results = {'result':'You have been banned!'};
                res.render('pages/fail',results);
            }
            else{
        		pool.query(`select * from users where username = '${username}' and password = '${password}'`, (error, results) => {
        			if (results.rows.length > 0) {
        				req.session.loggedin = true;
        				req.session.username = username;
        				res.redirect('/home');
        			}
        			else {
        				//res.send('Incorrect Username and/or Password!');
        				var results = {'result':'You have entered an invalid Username and/or Password!'};
        				res.render('pages/fail',results);
        			}
        			res.end();
        		});
            }
        });
	} else {
		//res.send('Please enter Username and Password!');
		var results = {'result':'Please enter Username and Password!'};
		res.render('pages/fail',results);
		res.end();
	}
});

app.post('/signup', (req, res) => {
	var username = req.body.signupUser;
	var password = req.body.signupPass;
	if (username && password) {
		pool.query(`select * from users where username = '${username}'`, (error, results) => {
			if (results.rows.length <= 0) {
				pool.query(`insert into users VALUES('Random', '${username}','${password}',0,100, 1, 0, 0, 0, 0, 0, 1, 0, 0, 'white', 'circle');`, (error, results) => {
					if(error){
						res.send('Something went wrong!');
						var results = {'result':'Something went wrong!'};
						//res.render('pages/fail',results);

					}
				});
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/home');
			}
			else {
				//res.send('Username is already taken!');
				var results = {'result':'Username is already taken!'};
				res.render('pages/fail',results);

			}

		});
	} else {
		//res.send('Please enter Username and Password!');
		var results = {'result':'Please enter Username and Password!'};
		res.render('pages/fail',results);
		res.end();
	}
});

const queryWrapper = (statement) => {

    return new Promise((resolve, reject) => {

        db.query(statement, (err, result) => {
            if(err)
                return reject(err);

            resolve(result);
        });

    });

};

app.get('/home', async (req, res) =>  {
	if (req.session.loggedin) {
        name = req.session.username;
		const client = await pool.connect();
		const indv_stat = await client.query(`
	    SELECT *
		FROM stats INNER JOIN (SELECT username, exp, type, shape, color
			FROM users WHERE username = '${req.session.username}') B
			ON stats.username = B.username;`
		);

		const top5 = await client.query(`
		SELECT * from stats ORDER BY wins DESC LIMIT 5;
		`);
		//const indv_stats = { 'indv_stats': (indv_stat) ? indv_stat.rows : null};
		// const top_stat = client.query(`SELECT * FROM stats ORDER BY wins limit 10;`);
		// if (PORT == null || PORT == ""){
		// 	PORT=8080;
		// }
		// let list = []
		// console.log("this is gustspeed", gustSpeed);
		res.render('pages/home', {
			'indv_stats':(indv_stat) ? indv_stat.rows : null,
			'top5':(top5) ? top5.rows : null,
			'connection':PORT,
            // 'user':req.session.username
			// 'gust': gustSpeed
		});
		// res.end();
	}
});
app.use(express.static(__dirname + '/game'));

function getName(){
    var username = pool.query(`select username from users`)
}

app.post('/play', async (req,res) => {
    var user_name = name;
    const indv_stat = await pool.query(`
	    SELECT * FROM stats INNER JOIN (SELECT username, exp, type, shape, color
			FROM users WHERE username = '${req.session.username}') B
			ON stats.username = B.username;`
	);
    pool.query(`select color from users where username='${user_name}'`,(error,result)=>{
        res.render('../game/index',{
            'indv_stats':(indv_stat) ? indv_stat.rows : null,
            'currentColor': result.rows[0].color,
            'connection':PORT
        });
    });

});

app.get('/logout', (req,res) => {
    req.session.destroy(function(err) {
        if(err){
            res.send("Logout error!");
        }
        else{
            res.redirect('/');
        }
    })
});

app.post('/banUser', (req,res) => {
    var username = req.body.banUser;
    pool.query(`select from users where username='${username}'`, (error, results) => {
        if(results.rows.length > 0){
            var banUser = `update users set type=-1 where username='${username}'`;
            pool.query(banUser);
            var results = {'result':'Successfully banned user.'};
            res.render('pages/admin',results);
        }
        else{
            var results = {'result':'User does not exist!'};
            res.render('pages/admin',results);
        }
    });
});

app.post('/adminUser', (req,res) => {
    var username = req.body.adminUser;
    pool.query(`select from users where username='${username}'`, (error, results) => {
        if(results.rows.length > 0){
            var adminUser = `update users set type=4 where username='${username}'`;
            pool.query(adminUser);
            var results = {'result':'Successfully given user admin privileges!'};
            res.render('pages/admin',results);
        }
        else{
            var results = {'result':'User does not exist!'};
            res.render('pages/admin',results);
        }
    });
});

app.post('/editUser', (req,res) => {
    var username = req.body.idEdit
    var kills = parseInt(req.body.kills);
    var deaths = parseInt(req.body.deaths);
    var exp = parseInt(req.body.exp);
    pool.query(`select from users where username='${username}'`, (error, results) => {
        if(results.rows.length > 0){
            var editUser = `update stats set kills=${kills}, deaths=${deaths} where username='${username}'`;
            pool.query(editUser);
            var editUser2 = `update users set exp=${exp} where username='${username}'`;
            pool.query(editUser2)
            var results = {'result':'Successfully updated stats!'};
            res.render('pages/admin',results);
        }
        else{
            var results = {'result':'User does not exist!'};
            res.render('pages/admin',results);
        }
    });
});

app.post('/buy', (req,res) => {
    var buyItem = req.body.item;
    var username = req.session.username;
    pool.query(`select from users where username='${username}' and ${buyItem}= 0`, (err, result) => {
        if(result.rows.length > 0){
            pool.query(`select from users where username='${username}' and exp>=50`, (error, results) => {
                if(results.rows.length > 0){
                    pool.query(`update users set ${buyItem}=1 where username='${username}'`, (error, results) => {
                    pool.query(`update users set exp = exp - 50 where username ='${username}'`);
                    var results = {'result':'Successfully purchased!'};
                    res.render('pages/admin', results);
                    });
                }
                else{       //Not enough EXP to buy
                    var results = {'result':'Not enough Exp to buy!'};
                    res.render('pages/admin', results);
                }
            });
        }
        else{
            var results = {'result':'Already owned item!'};
            res.render('pages/admin', results);
        }
    });
});

app.get('/weather',async (req,res)=>{
	var exclude = "?exclude=minutely,hourly,daily,alerts,flags"
	const api_url = `https://api.darksky.net/forecast/5b2b11b4a6e6971c833905cf737ad208/49.2488,122.9805`+exclude;
	const weather_response = await fetch(api_url);
	const data = await weather_response.json();
	const wind ={
		speed: data.currently.windSpeed,
		direction: data.currently.windBearing
	};
	// gustSpeed = wind;
	// console.log("in weather gustspeed = ",gustSpeed);
	//console.log(wind);
	res.json(wind);
});


app.post('/inv', (req,res) => {
    var color = req.body.inventory;
    var username = req.session.username;
    pool.query(`select from users where username='${username}' and ${color}= 1`, (err, result) => {
        if(result.rows.length > 0){
            pool.query(`update users set color='${color}' where username='${username}'`, (err, results) => {
				var results = {'result':'You changed your color!'};
            	res.render('pages/admin', results);
			});
		}
		else{
			var results = {'result':'You dont own that color!'};
            res.render('pages/admin', results);
		}
    });
});

 //app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
