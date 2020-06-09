
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");

var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Events = Matter.Events,
    Composites = Matter.Composites,
    Composite = Matter.Composite,
    Common = Matter.Common,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Vector = Matter.Vector,
    Bounds = Matter.Bounds,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    lastShot = new Date();
    keys = [],
    boxes = [],
    speed = [],
    players = {};

var winds,
    windsDir,
    xWind = 0,
    yWind = 0;

document.body.addEventListener("keydown", function(e) {
   keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});

function createBullet(x, y, r, id) {
    var options = {
        friction: 0,
        restitution: .15,
        mass: .5,
        render: {
            fillStyle: '#ff0000',
            lineWidth: 10
        }
    }
    this.body = Bodies.circle(x, y, r, options);
    this.r = r;
    this.id = id;
    this.body.force = { x: 0, y: 0 };
    World.add(world, this.body);
}

function Circle(x, y, r) {
    var options = {
        friction: 0,
        restitution: .15,
        mass: 2,
        health: 3,
        kills: 0,
        deaths: 0,
        render: {
            fillStyle: color(),
            lineWidth: 10
        }
    }
    this.body = Bodies.circle(x, y, r, options);
    this.r = r;
    this.body.force = { x: 0, y: 0 };
    World.add(world, this.body);

    this.keymove = function (){
        if (keys[87] || keys[38]) {                                   // if 'w' or up is pressed
            Body.setVelocity(players[socket.id].body, {x: players[socket.id].body.velocity.x, y: -5});
        }
        if (keys[83] || keys[40]) {                                   // if 's' or down is pressed
            Body.setVelocity(players[socket.id].body, {x: players[socket.id].body.velocity.x, y: 5});
        }
        if (keys[65] || keys[37]) {                                   // if 'a' or left is pressed
            Body.setVelocity(players[socket.id].body, {x: -5, y: players[socket.id].body.velocity.y});
        }
        if (keys[68] || keys[39]) {                                   // if 'd' or right is pressed
            Body.setVelocity(players[socket.id].body, {x: 5, y: players[socket.id].body.velocity.y});
        }
        if (!keys[87] && !keys[38] && !keys[83] && !keys[40] && !keys[65] && !keys[37] && !keys[68] && !keys[39]) {
            Body.setVelocity(players[socket.id].body, {x:0, y:0});
        }
    }
}


function Boundary(x, y, w, h, a, colour) {
  var options = {
    friction: 0.1,
    restitution: 1,
    angle: a,
    isStatic: true,
    render: {
      fillStyle: colour,
      lineWidth: 0
    }
  }
  this.body = Bodies.rectangle(x, y, w, h, options);
  this.w = w;
  this.h = h;
  World.add(world, this.body);
}

// create engine
var engine = Engine.create(),
    world = engine.world;

// create renderer
var render = Render.create({
    element: document.body,
    engine: engine,
    canvas: canvas,
    options: {
        width: window.innerWidth*0.8,
        height: window.innerHeight,
        hasBounds: true,
        wireframes: false,
        showAngleIndicator: false,
        showBounds: false,
        background: '#262626'
        }
    });

window.onresize = function(e){
    canvas.width = window.innerWidth*0.8;
    canvas.height = window.innerHeight;
}


Render.run(render);

// create runner
var runner = Runner.create();
Runner.run(runner, engine);

// remove gravity
engine.world.gravity.y = 0;

// add mouse control
var mouse = Mouse.create(render.canvas),
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

World.add(world, mouseConstraint);

// keep the mouse in sync with rendering
render.mouse = mouse;

// declare bodies
var myPlayer,
    upperBoundary,
    lowerBoundary,
    leftBoundary,
    rightBoundary,
    walls = [];

// add bodies
var spawnX = Math.floor(Math.random() * 3000),
    spawnY = Math.floor(Math.random() * 3000);

socket.emit('randomSpawn', spawnX, spawnY);

setTimeout(function(){

    myPlayer = socket.id;

    Events.on(mouseConstraint, 'mousedown', function(e) {

            // player position
            var posx = players[socket.id].body.position.x;
            var posy = players[socket.id].body.position.y;

            // mouse position
            var mousex = mouse.position.x;
            var mousey = mouse.position.y;

            // distance from player to mouse position
            var vx = mousex - posx;
            var vy = mousey - posy;
            var dist = Math.sqrt(vx*vx + vy*vy);


            var dx = vx/dist;
            var dy = vy/dist;
            var opp = mousey - posy;
            var adj = mousex - posx;

            var currShot = new Date().getTime();
            if ((currShot - lastShot) >= 1000){
                //Checking for wind direction | North is negative, West is negative
                if(windsDir <= 90){
                    xWind = Math.sin(windsDir) * winds;
                    yWind = Math.cos(windsDir) * winds;
                    // console.log("here1");
                }
                if(windsDir > 90 && windsDir <= 180){
                    xWind = Math.sin(windsDir) * winds;
                    yWind = -(Math.cos(windsDir) * winds);
                    // console.log("here2");
                }
                if(windsDir > 180 && windsDir <= 270){
                    xWind = -(Math.sin(windsDir) * winds);
                    yWind = -(Math.cos(windsDir) * winds);
                    // console.log("here3");
                }
                if(windsDir > 270){
                    xWind = -(Math.sin(windsDir) * winds);
                    yWind = Math.cos(windsDir) * winds;
                    // console.log("here4");
                }
                while(Math.abs(xWind) >= .3){
                    xWind = xWind/5;
                    // console.log("here5");
                }
                while(Math.abs(yWind) >= .3){
                    yWind = yWind/5;
                    // console.log("here6");
                }
                ////////////////////////////////////////////////////////////////////


                // console.log("wind speed =", winds );
                // console.log("wind direction =", windsDir );
                // console.log("xwind speed =", xWind );
                // console.log("ywind speed =", yWind );
                // console.log("dx =", dx*.5 );
                // console.log("dy =", dy*.5 );
                dx = dx*0.5 + xWind; //change this for speed(winds/20)
                dy = dy*0.5 + yWind;

                // tell server a mouse has been pressed
                socket.emit('projectile_created', posx, posy, dx, dy, socket.id);
                // every one connected will add projectile to world

                // set the time when the last shot was fired to current time
                lastShot = currShot;
            }
        });

        socket.on('add projectile to world', function(posx, posy, dx, dy, id) {
            bullet = new createBullet(posx+dx*100, posy+dy*100, 6, id);// how the projectiles come out change later
            boxes.push(bullet);
            speed.push([dx, dy]);
            World.add(world, bullet);
         });  
        

    World.add(world, [
        // myPlayer
        players[socket.id] = new Circle(spawnX, spawnY, 50),

        // boundaries
        upperBoundary = new Boundary(1500, -250, 4000, 500, 0, 'DarkViolet'),  // (x, y, w, h, angle)
        lowerBoundary = new Boundary(1500, 3250, 4000, 500, 0, 'DarkViolet'),
        leftBoundary = new Boundary(-250, 1500, 500, 4000, 0, 'DarkViolet'),
        rightBoundary = new Boundary(3250, 1500, 500, 4000, 0, 'DarkViolet'),

        // walls

        walls[0] = new Boundary(500, 500, 450, 10, -0.785398, 'lime'), // top left
        walls[1] = new Boundary(2500, 500, 450, 10, 0.785398, 'yellow'),
        walls[2] = new Boundary(500, 1500, 400, 10, 0, 'blue'),
        walls[3] = new Boundary(2500, 1500, 400, 10, 0, 'blue'),
        walls[4] = new Boundary(1500, 500, 10, 400, 0, 'red'),
        walls[5] = new Boundary(1500, 2500, 10, 400, 0, 'red'),
        walls[6] = new Boundary(500, 2500, 450, 10, 0.785398, 'yellow'),
        walls[7] = new Boundary(2500, 2500, 450, 10, -0.785398, 'lime'),
        walls[8] = new Boundary(1500, 1100, 300, 10, 0, 'cyan'),
        walls[9] = new Boundary(1500, 1900, 300, 10, 0, 'cyan'),
        walls[10] = new Boundary(1100, 1500, 10, 300, 0, 'honeydew'),
        walls[11] = new Boundary(1900, 1500, 10, 300, 0, 'honeydew')
    ]);



    socket.on('updateAll', function(playerInfo){
        if (socket.id){
            if (playerInfo.id != socket.id){
                var i;
                for (i = 0; i < Object.keys(players).length; i++){
                    var curr = Object.keys(players)[i];
                    if (curr == playerInfo.id){
                        Body.setPosition(players[curr].body, { x: playerInfo.x, y: playerInfo.y });
                        Body.setVelocity(players[curr].body, { x: playerInfo.vx, y: playerInfo.vy })
                        Body.setAngle(players[curr].body, playerInfo.angle);
                    }
                }
            }
        }
    });

    // get the centre of the map
    var mapCentre = {
        x: 1500,
        y: 1500
    };

    // make the world bounds a little bigger than the render bounds
    world.bounds.min.x = -500;
    world.bounds.min.y = -500;
    world.bounds.max.x = 4000;
    world.bounds.max.y = 4000;

    // keep track of current bounds scale (view zoom)
    var boundsScaleTarget = 1,
        boundsScale = {
            x: 1,
            y: 1
        };


    // use the engine tick event to control our view
    Events.on(engine, 'beforeTick', function() {
        document.getElementById('hp').innerHTML = "Health : " + players[myPlayer].body.health;
        document.getElementById('winds').innerHTML = "Wind : " + winds;
        document.getElementById('kills').innerHTML = "Kills : " + players[myPlayer].body.kills;
        document.getElementById('deaths').innerHTML = "Deaths : " + players[myPlayer].body.deaths;
        if(windsDir <= 90){
           document.getElementById('windd').innerHTML = "Wind Direction : N" + windsDir + "&degE"; 
        }
        else if(windsDir > 90 && windsDir <= 180){
            document.getElementById('windd').innerHTML = "Wind Direction : S" + (windsDir-90) + "&degE"; 
        }
        else if(windsDir > 180 && windsDir <= 270){
            document.getElementById('windd').innerHTML = "Wind Direction : S" + (windsDir-180) + "&degW"; 
        }
        else if(windsDir > 270 && windsDir <= 360){
            document.getElementById('windd').innerHTML = "Wind Direction : N" + (windsDir-270) + "&degW"; 
        }
            
        var world = engine.world,
            mouse = mouseConstraint.mouse;

        players[socket.id].body.angle = Math.atan2(mouse.position.y-players[socket.id].body.position.y, mouse.position.x-players[socket.id].body.position.x);
        players[socket.id].keymove();// center view at player

        Bounds.shift(render.bounds,
        {
            x: players[socket.id].body.position.x - window.innerWidth / 2,
            y: players[socket.id].body.position.y - window.innerHeight / 2
        });

        if (players[socket.id].oldPosition && (players[socket.id].body.position.x != players[socket.id].oldPosition.x || players[socket.id].body.position.y != players[socket.id].oldPosition.y || players[socket.id].body.angle != players[socket.id].oldPosition.angle )){
            socket.emit('playerUpdate', {id: socket.id, x: players[socket.id].body.position.x, y: players[socket.id].body.position.y, angle: players[socket.id].body.angle, vx: players[socket.id].body.velocity.x, vy: players[socket.id].body.velocity.y});
        }

        players[socket.id].oldPosition = {
          x: players[socket.id].body.position.x,
          y: players[socket.id].body.position.y,
          angle: players[socket.id].body.angle
        };

        //update projectiles position, tells it to server
        socket.emit("tell_ppos");
        //updates the position of the projectiles
    });

    async function windSpeed(){
        try{
          const api_url = '/weather';
          const response = await fetch(api_url);
          const json = await response.json();
          winds = json.speed;
          windsDir = json.direction;
        }
        catch (error) {
          console.error(error);
        }
      }
      windSpeed();

}, 200);

socket.on('playerConnect', function(player){
    if ((socket.id) && (socket.id != player.id)){     // if a new player connects
        World.add(world, [
            players[player.id] = new Circle(player.x, player.y, 50)
        ]);
    }
});

socket.on('playerDisconnect', function(playerID){
    var i;
    for (i = 0; i < Object.keys(players).length; i++){
        var curr = Object.keys(players)[i];
        if (curr == playerID){
            // delete circle from world
            World.remove(world, players[curr].body);
            // remove from dict of current players
            delete players[playerID];
        }
    }
});

socket.on('p_update', function() {
    var hitPlayerId;
    var bulletHitId;
    for (var i = 0; i < boxes.length; i++) {
        boxes[i].body.position.x += speed[i][0];
        boxes[i].body.position.y += speed[i][1];
        var collision1 = Matter.SAT.collides(boxes[i].body, upperBoundary.body);
        var collision2 = Matter.SAT.collides(boxes[i].body, lowerBoundary.body);
        var collision3 = Matter.SAT.collides(boxes[i].body, rightBoundary.body);
        var collision4 = Matter.SAT.collides(boxes[i].body, leftBoundary.body);

        var collisionWall = false;
        for (var j = 0; j < walls.length; j++){
            if (Matter.SAT.collides(boxes[i].body, walls[j].body).collided){
               collisionWall = true;
            }
        }

        var bulletCollision = false;
        for (y = 0; y < Object.keys(players).length; y++){
            var curr = Object.keys(players)[y];
            if(boxes[i].id != curr){
                if(Matter.SAT.collides(boxes[i].body, players[curr].body).collided){
                    bulletCollision = true;
                    hitPlayerId = curr;
                    bulletHitId = boxes[i].id;
                }  
            }
        }
       if (collision1.collided || collision2.collided || collision3.collided ||collision4.collided || bulletCollision || collisionWall) {
            if(bulletCollision && boxes[i].id == myPlayer){
                socket.emit('hitPlayer', hitPlayerId, bulletHitId);
            }
            World.remove(world, boxes[i].body);
            boxes.splice(i,1);
            speed.splice(i,1);   
            bulletCollision = false;        
        }
    }
 });

socket.on('newPlayer', function(data){
    if (socket.id == data.newID){   // create existing circles (only) if you're the new player
        for (var i = 0; i < Object.keys(data.playersData).length; i++){
            var curr = Object.keys(data.playersData)[i];
            if (curr != socket.id){
                World.add(world, [
                    players[curr] = new Circle(data.playersData[curr].x, data.playersData[curr].y, 50)
                ]);
            }
        }
    }
});

socket.on('gotHit',function(id, bulletId){
    if(myPlayer == id){
        players[myPlayer].body.health -= 1;
    }
    if (players[myPlayer].body.health == 0) {
        //tell server that this player has died
        socket.emit('has_died', myPlayer, bulletId);
    }
});

socket.on('respawn :(', function(playerinfo, myPlayer, bulletId) {
    Body.setPosition(players[myPlayer].body, { x: playerinfo.x, y: playerinfo.y });
    players[myPlayer].body.deaths += 1;
    players[bulletId].body.kills += 1;
    players[myPlayer].body.health = 3;
    
});