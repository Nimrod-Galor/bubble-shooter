window.requestAnimationFrame(render);
window.addEventListener("load", init);

var canvas = document.getElementById('canvas');
canvas.addEventListener('mousemove', function(evt) {
    let rect = canvas.getBoundingClientRect();
    mouse.x = evt.clientX - rect.left;
    mouse.y = evt.clientY - rect.top;
});
canvas.addEventListener("click", fire);

var ctx = canvas.getContext('2d');
var mouse = {x:0,y:0, angle:0};
var needle = {x1:350, y1: 620, x2:0, y2:0};
var score = 0;
var level = 0;
var numOfShots = 0;
var currentBall;
var nextBall;
var popTimer = null;
var fireReady = true;
var descend = 10;
let rowFull = true;

var ballVariants = ["#f22", "#f2f", "#22f", "#2ff", "#2f2", "#ff2"];
var balls = [];
var ballsToPop = [];

class Ball{
    constructor(x, y, color){
        this.x = x;
        this.y = y;
        this.colorIndex = color;
        this.angle = 0;
    }
}

function init(){
    score = 0;
    numOfShots = 0;
    currentBall = new Ball(350, 620, getRndBallColorIndex());
    nextBall = new Ball(200, 658, getRndBallColorIndex());

    // init balls
    rowFull = true;
    let tmpx = 42;
    let tmpy = 42;
    for(let i=1; i<30; i++){
        let tmpBall = new Ball(tmpx, tmpy, getRndBallColorIndex());
        balls.push(tmpBall);
        tmpx += 69;
        if(tmpx > 690){// new row
            tmpy += 58;
            if(rowFull){
                tmpx = 77;
                rowFull = false;
            }else{
                tmpx = 42;
                rowFull = true;
            }
        }
    }
}

function render(evt){
    ctx.clearRect(0, 0, 950, 700);

    /********************************************/
    /***********    Frame   *********************/
    /********************************************/
    var gradient1 = ctx.createLinearGradient(0, 0, 700, 0);
    gradient1.addColorStop("0", "#6666ff");
    gradient1.addColorStop("0.5", "#66ff66");
    gradient1.addColorStop("1.0", "#ff6666");

    // Fill with gradient
    ctx.strokeStyle = gradient1;
    ctx.lineWidth = 10;
    ctx.strokeRect(2, 2, 700, 696);

    /********************************************/
    /***********    Side Menu   *****************/
    /********************************************/
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(704, 0, 250, 700);
    
    // Score
    ctx.font = "30px Verdana";
    // Create gradient
    ctx.fillStyle = "blue";
    ctx.fillText("Score:", 780, 50); 

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(score, 830, 100); 

    // Level
    ctx.fillStyle = "blue";
    ctx.fillText("Level:", 780, 200); 

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(level, 830, 250); 

    // Shots
    ctx.fillStyle = "blue";
    ctx.fillText("Shots:", 780, 350); 

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(numOfShots, 830, 400); 
    
    /********************************************/
    /**********     Aim    **********************/
    /********************************************/
    
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.moveTo(20, 620);
    ctx.lineTo(310, 620);
    ctx.moveTo(390, 620);
    ctx.lineTo(680, 620);
    ctx.strokeStyle = "red";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(350, 620, 40, 3.15, 2 * Math.PI);
    ctx.strokeStyle = "red";
    //ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.arc(350, 620, 10, 0, Math.PI * 2, true);
    ctx.stroke();
    /********************************************/
    /**********     Needle    *************/
    /********************************************/
    let dx = mouse.x - needle.x1;
    let dy = (mouse.y < 610 ? mouse.y : 610) - needle.y1;
    mouse.angle = Math.atan2(dy, dx);

    needle.x2 = needle.x1 + 80 * Math.cos(mouse.angle);
    needle.y2 = needle.y1 + 80 * Math.sin(mouse.angle);

    ctx.beginPath();
    ctx.moveTo(needle.x1, needle.y1);
    ctx.lineTo(needle.x2, needle.y2);
    ctx.stroke();

    /********************************************/
    /**********     Current Ball    *************/
    /********************************************/
    if(currentBall.x < 350){
        currentBall.x *= 1.1;
        if(currentBall.x > 350){
            currentBall.x = 350;
        }
    }else if(currentBall.y > 620){
        currentBall.y *= 0.98;
        if(currentBall.y < 620){
            currentBall.y = 620;
        }
    }

    ctx.save();
    let grd = ctx.createRadialGradient(currentBall.x -10, currentBall.y -13, 1, currentBall.x, currentBall.y, 35);
    grd.addColorStop(0, "white" );
    grd.addColorStop(1, ballVariants[currentBall.colorIndex] );
    ctx.beginPath();
    ctx.arc(currentBall.x, currentBall.y, 33, 0, 2 * Math.PI);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = ballVariants[currentBall.colorIndex];
    ctx.stroke(); 
    ctx.restore();
    /********************************************/
    /**********     Next Ball    ****************/
    /********************************************/
    grd = ctx.createRadialGradient(nextBall.x -10, nextBall.y -13, 1, nextBall.x, nextBall.y, 35);
    grd.addColorStop(0, "white" );
    grd.addColorStop(1, ballVariants[nextBall.colorIndex] );
    ctx.beginPath();
    ctx.arc(nextBall.x, nextBall.y, 33, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = ballVariants[nextBall.colorIndex];
    ctx.stroke(); 

    /********************************************/
    /**********     Balls    ********************/
    /********************************************/

    let userLossFlag = false;
    // move bak row down
    if(balls[0].y < 42){
        // move all balls down
        for(let i=0; i<balls.length; i++){
            balls[i].y += 3;
            if(balls[i].y >= 390){
                userLossFlag = true;
            }
        }

        if(balls[0].y == 42){
            fireReady = true;
        }
    }

    // increase pop timer
    if(popTimer !== null){
        popTimer -= 1;
        fireReady = false;
    }
    // time to pop ball
    if(popTimer === 0){
        // add score
        score += (10 * ballsToPop.length);
        // select currect ball to pop (remove from ball arr)
        for(let i=0; i<balls.length; i++){
            if(balls[i].x == ballsToPop[0].x && balls[i].y == ballsToPop[0].y){
                balls.splice(i, 1);
                ballsToPop.splice(0, 1);
                if(ballsToPop.length == 0){
                    popTimer = null;
                    fireReady = true;
                }else{
                    popTimer = 10;
                }
                break;
            }
        }
    }

    
    // render all balls
    for(let i=0; i<balls.length; i++){
        if(balls[i].angle != 0){// if fire move ball
            balls[i].x += 12  * Math.cos(balls[i].angle);
            balls[i].y += 12 * Math.sin(balls[i].angle);
        
            // bouns of wall
            if(balls[i].x > 660 || balls[i].x < 45){// Wall collision
                balls[i].angle = Math.PI - balls[i].angle;
            }
            // is ceiling
            if(balls[i].y <= 42){
                balls[i].angle = 0;
                balls[i].y = 42;
                // snug to x
                let tmpx = (balls[i].x - 42) % 69;
                balls[i].x -= tmpx <= 35 ? tmpx : -(69 - tmpx);// balls[i].x > balls[b].x ? balls[b].x + 35 : balls[b].x - 35;
                fireReady = true;
            }
            // check balls collision
            
            for(let b=0; b<balls.length; b++){
                if(b == i){ continue; }
                let a = 60;//r1 + r2;
                let x = balls[i].x - balls[b].x;
                let y = balls[i].y - balls[b].y;
    
                if (a > Math.sqrt((x * x) + (y * y))) {// collision
console.log("collision");
                    balls[i].angle = 0;
                    // snug ball
                    if(balls[i].x > balls[b].x && balls[b].x < 670){
                        balls[i].x = balls[b].x + 35;

                    }else{
                        balls[i].x = balls[b].x - 35;
                    }
                    balls[i].y = balls[i].y > balls[b].y ? balls[b].y + 58 : balls[b].y;

                    ballsToPop.push(balls[i]);
                    findAllAttachedBalls(balls[i]);
                    // check if we have more than 3 attached
                    if(ballsToPop.length >= 3){
                        // detached from ghroup balls
                        checkDetachedBalls();
                        popTimer = 10;
                    }else{
                        //reset array;
                        ballsToPop = [];
                        fireReady = true;
                    }

                    break;
                }
            }
        }

        grd = ctx.createRadialGradient(balls[i].x -10, balls[i].y -13, 1, balls[i].x, balls[i].y, 35);
        grd.addColorStop(0, "white" );
        grd.addColorStop(1, ballVariants[balls[i].colorIndex] );
        ctx.beginPath();
        ctx.arc(balls[i].x, balls[i].y, 33, 0, 2 * Math.PI);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = ballVariants[balls[i].colorIndex];
        ctx.stroke(); 
    }

    //check if time to descend
    if(descend === 0){
        descend = 10;
        // add new back row
        let tmpx;
        let tmpy = -18;
        let ballsInRow;
        if(!rowFull){
            tmpx = 77;
            ballsInRow = 9;
            rowFull = true;
        }else{
            tmpx = 42;
            ballsInRow = 10;
            rowFull = false;
        }
        for(let i=0; i<ballsInRow; i++){
            let tmpBall = new Ball(tmpx, tmpy, getRndBallColorIndex());
            balls.unshift(tmpBall);
            tmpx += 69;
        }
    }

    if(userLossFlag){
        return endGame();
    }

    window.requestAnimationFrame(render);
}

function findAllAttachedBalls(tball){
//console.log("findAllAttachedBalls");
    // check balls collision
    for(let b=0; b<balls.length; b++){
        // check if ball in pop arr
        if(ballsToPop.includes(balls[b]) || balls[b] == tball){
            // same ball continue
            continue;
        }
        
        let a = 75;//r1 + r2;
        let x = tball.x - balls[b].x;
        let y = tball.y - balls[b].y;

        if (a > Math.sqrt((x * x) + (y * y))) {// collision
//console.log(`ball:${b} attached`);
            if(tball.colorIndex == balls[b].colorIndex){
//console.log("color match");
                ballsToPop.push(balls[b]);
                findAllAttachedBalls(balls[b]);
            }
        }
    }
}

function checkDetachedBalls(){
    // remove from ball list all ball that are not attached to other balls (detached from group).
    let onwall = balls.filter(o => { return (o.x <= 77 || o.x >= 600 || o.y == 42) && !ballsToPop.includes(o)});
   // onwall.map(o => o.colorIndex = 0);
    let tocheck = balls.filter(o => {return !(onwall.includes(o) || ballsToPop.includes(o))})

    for(let a=0; a<tocheck.length; a++){
        let isgroup = false;
        for(let b=0; b<onwall.length; b++){
            let c = 71;//r1 + r2;
            let x = tocheck[a].x - onwall[b].x;
            let y = tocheck[a].y - onwall[b].y;

            if (c > Math.sqrt((x * x) + (y * y))) {// collision
                // add ball to onwall
                onwall.push(tocheck[a]);
                isgroup = true;
                break;
            }
        }
        if(!isgroup){// ball is detached. add to pop arr.
            ballsToPop.push(tocheck[a]);
        }
    }
}

function fire(){
    if(!fireReady){
        return;
    }
    descend -= 1;
    fireReady = false;
    numOfShots += 1;
    // start fire sequence
    currentBall.angle = mouse.angle;
    // add current ball to ball list
    balls.push({...currentBall});
    // switch current with next ball
    currentBall.x = nextBall.x;
    currentBall.y = nextBall.y;
    currentBall.colorIndex = nextBall.colorIndex;
    currentBall.angle = 0;
    // reste next ball
    nextBall.colorIndex = getRndBallColorIndex();
}

function getRndBallColorIndex(){
    // generate rendom index 0-6
    return Math.floor((Math.random() * 6));
}

function endGame(){
    ctx.font = "60px Verdana";
    // Create gradient
    var gradient = ctx.createLinearGradient(0, 0, 500, 0);
    gradient.addColorStop("0", "purple");
    gradient.addColorStop("0.25", "blue");
    gradient.addColorStop("0.5", "green");
    gradient.addColorStop("0.75", "yellow");
    gradient.addColorStop("1.0", "red");
    ctx.textAlign = "center";
    ctx.fillStyle = gradient;
    ctx.fillText("Game", 250, 200);
    ctx.fillText("Over!", 450, 200);
}