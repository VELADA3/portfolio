// JavaScript Document
import "./phaser.min.js";

//CONSOLE SHORTHAND---------------
var C = console.log.bind(console);

//GAME VARIABLES---------------
var config = {
    type: Phaser.WEBGL,
	height: window.innerHeight,
	width: window.innerWidth,
	transparent: true,
	disableContextMenu: true,
	domCreateContainer: true,
	parent: document.getElementById('game'),
	antialiasGL: true,
	physics: {
		default:"arcade",
		arcade:{
			debug: false
		},
	},
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

//game managers
var game = new Phaser.Game(config);
var scene; //images
var inputMgr; //events
var physicsMgr; //collisions

//the ball
var ball; //the ball
var throwForce = 10; //higher values send the ball further when thrown
var ballRad = 256; //should be half the width of the ball image
var ballDamp = 16; //lower values are slidier
var ballBounce = 75; //lower values are less bouncy
var ballMass = .65; //higher values make the ball fall faster

//the drop timer
var dropTime = 500;
var itimer = 4;
var icenter;
var ileft;
var iright;

//misc global declarations
var coin;
var pRain;

//GAME FUNCTIONS---------------
function preload (){	
	//manager declarations
	inputMgr = this.input;
	physicsMgr = this.physics;
	scene = this;
	
	//ball, coin, and particle preload
	this.load.image('ball', './bin/objects/ball.png');
	this.load.image('shadow', './bin/objects/ball.png');
	this.load.image('flares', './bin/objects/flare.png');
	this.load.image('coin', './bin/objects/coin.png');
	
	//slide the drop rate
	$(function() {
		$( "#dropSlider" ).slider({
			max: 750,
			min: 300,
			orientation: "vertical",
			step: 10,
			value: 500,
			slide: function(){
				dropTime = $( "#dropSlider" ).slider( "value" );
			}
		});
		
		$(".options").slideToggle(0);
	});
	
	//rain toggle initialization
	$( function() {
		$( "#rainCheck" ).checkboxradio({
			icon: false,
		});
	} );
	
}

function create (){
	scene.scene.pause();
	//the ball physics
	ball = physicsMgr.add.image(window.innerWidth/4, window.innerHeight/2, 'ball')
		.setCircle(ballRad)
		.setBounce(ballBounce/100)
		.setCollideWorldBounds(true)
	ball.body.setGravityY(3000)
		.setMass(ballMass*1000)
		.setDrag(1 - (ballDamp/1000), 1 - (ballDamp/1000));
	ball.body.onWorldBounds = true;
	ball.body.useDamping = true;
	ball.setScale(.25)
		.setDepth(1);
	
	//ball particles on world collide
	var p01 = this.add.particles('flares');
	var p02 = this.add.particles('flares');
	physicsMgr.world.on('worldbounds', function(gameObject, up, down, left, right){
		if(Math.abs(gameObject.velocity.y)/1000 > .2){
			var emitDir = new Phaser.Geom.Ellipse(gameObject.x+gameObject.width/2, gameObject.y+gameObject.height, 50, 20);
			
			if(up){
				emitDir = new Phaser.Geom.Ellipse(gameObject.x+gameObject.width/2, gameObject.y, 50, 20);
			}
			
			else if(left){
				emitDir = new Phaser.Geom.Ellipse(gameObject.x, gameObject.y+gameObject.height/2, 50, 20);
			}
			
			else if(right){
				emitDir = new Phaser.Geom.Ellipse(gameObject.x+gameObject.width, gameObject.y+gameObject.height/2, 50, 20);
			}
			
			else if(down){
				emitDir = new Phaser.Geom.Ellipse(gameObject.x+gameObject.width/2, gameObject.y+gameObject.height, 50, 20);
			}
			
			var emitter1 = p01.createEmitter({
				emitZone:{
					type: 'random',
					source: emitDir,
					seamless: true,
					yoyo: true,
					quantity: 3,
				},
				blendMode: 'SCREEN',
				maxParticles:30,
				speed: {min: 40, max: 120 },
				acceleration: true,
				accelerationX: gameObject.velocity.x/3,
				accelerationY: gameObject.velocity.y/3,
				lifespan: {min: 300, max: 350},
				gravityY: 500,
				angle: {min:-45, max:-135},
				bounce: .25,
				bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
				collideBottom: true, collideTop: true, collideLeft: true, collideRight : true,
				scale: { start: 0.2, end: 0 },
				quantity: {min: 1, max: 5},
				alpha: {min:.1, max: .3},
				deathCallback: function(){emitter1.setAlpha(0)},
			});
			var emitter2 = p02.createEmitter({
				emitZone:{
					type: 'random',
					source: emitDir,
					seamless: true,
					yoyo: true,
					quantity: 3,
				},
				blendMode: 'MULTIPLY',
				maxParticles:20,
				speed: {min: 40, max: 120 },
				acceleration: true,
				accelerationX: gameObject.velocity.x,
				accelerationY: gameObject.velocity.y,
				lifespan: {min: 300, max: 350},
				gravityY: -500,
				angle: {min:-45, max:-135},
				bounce: .25,
				bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
				collideBottom: true, collideTop: true, collideLeft: true, collideRight : true,
				scale: { start: 0.4, end: 0 },
				quantity: {min: 1, max: 5},
				alpha: {min:.1, max: .3},
				deathCallback: function(){emitter2.setAlpha(0)},
			});
			emitter1.manager.setDepth(2);
			emitter2.manager.setDepth(0);
		}
	});
	
	//rain
	pRain = this.add.particles('flares').createEmitter({
		emitZone:{
			type: 'random',
			source: new Phaser.Geom.Line(-500, -100, screen.width+500, -100),
			seamless: true,
			yoyo: true,
			quantity: 3,
		},
		maxParticles: 300,
		speed: {min: 10, max: 30 },
		acceleration: true,
		accelerationY: -50,
		lifespan: {min: 1000, max: 1250},
		gravityY: 2000,
		gravityX: 0, 
		angle: -180,
		bounce: .15,
		bounds: { x: -250, y: 0, width: window.innerWidth+500, height: window.innerHeight },
		collideBottom: true,
		scaleY: { start: .24, end: 0 },
		scaleX: { start: .08, end: 0 },
		quantity: {min: 1, max: 3},
		alpha: {min:.65, max: .8},
		blendMode: 'SOURCE_IN',
	});
	pRain.manager.setDepth(10);
	pRain.stop();
	
	//ball fondling ( ͡° ͜ʖ ͡°)
	ball.setInteractive();
	inputMgr.setDraggable(ball);
	var dropInterval;
	var frameInterval;
	
	inputMgr.on('dragstart', function (pointer, gameObject) {
		gameObject.x = pointer.x;
		gameObject.y = pointer.y;
		scene.tweens.add({
				targets: [icenter, ileft, iright],
				alpha: 1,
				duration: dropTime/3,
				ease: 'Circular'
		}, scene);
		gameObject.body.setAngularVelocity(0);
		gameObject.setVelocity(0,0);
		gameObject.body.setGravityY(0);
		
		$('#dropSlider').css("pointer-events", "none");
		
		dropInterval = setInterval(function(){
			inputMgr.emit("drop", pointer, gameObject);
			clearInterval(dropInterval);
			clearInterval(frameInterval);
		}, dropTime)
		
		frameInterval = setInterval(function(){
			itimer--;
		}, dropTime/4)
	
	});
	
	inputMgr.on('drop', function(pointer, gameObject){
		ball.removeInteractive();
		scene.tweens.add({
				targets: [icenter, ileft, iright],
				alpha: 0,
				duration: dropTime/3,
				ease: 'Circular'
			}, scene);
		itimer = 4;
		gameObject.body.setGravityY(3000);
		gameObject.setVelocity(0,0);
		inputMgr.setDragState(inputMgr.activePointer, 0);
		inputMgr.once('pointerup', function(){
			ball.setInteractive();
			$('#dropSlider').css("pointer-events", "initial");
		})
	});
	
	inputMgr.on('drag', function (pointer, gameObject) {
        gameObject.x = pointer.x;
        gameObject.y = pointer.y;
    });
	
	inputMgr.on('dragend', function (pointer, gameObject) {
		clearInterval(dropInterval);
		clearInterval(frameInterval);
		scene.tweens.add({
				targets: [icenter, ileft, iright],
				alpha: 0,
				duration: dropTime/3,
				ease: 'Circular'
			}, scene);
		itimer = 4;
        gameObject.body.setGravityY(3000);
		gameObject.setVelocity(pointer.velocity.x * throwForce, pointer.velocity.y * throwForce);
		$('#dropSlider').css("pointer-events", "initial");
    });
	
	//score stuff
	var coinSpd = 0;
	var score = 0;
	coin = physicsMgr.add.image(0, 0, 'coin');	
	randomCoin(true);
	
	inputMgr.on('score', function(){
		var r = Math.floor(Math.random()*256);
		var g = Math.floor(Math.random()*256);
		var b = Math.floor(Math.random()*256);
		var rand = "rgb("+r+","+g+","+b+")";
		$('body').css("background-color", rand)
		$('#hex').html("#"+r.toString(16).padStart(2,0)+g.toString(16).padStart(2,0)+b.toString(16).padStart(2,0));
		$('#score').html(score.toString());
		randomCoin(false);
	});
	
	function randomCoin(initial){
		if(coinSpd < 70){coinSpd++}
		score++;
		coin.destroy();
		if(initial){
			coin = physicsMgr.add.image(3*(window.innerWidth/4), window.innerHeight/4, 'coin');
		}
		else{
			var dirX = Math.random() < 0.5 ? -1 : 1;
			var dirY = Math.random() < 0.5 ? -1 : 1;
			coin = physicsMgr.add.image((window.innerWidth/8)*(Math.random()*8), (window.innerHeight/8)*(Math.random()*8), 'coin')
				.setVelocity(dirX*(coinSpd*dropTime)/20, dirY*(coinSpd*dropTime)/20)
				.setGravityY(50)
				.setAcceleration(dirX * 20, dirY * 20);
		}
		coin.setScale(.5)
			.setCollideWorldBounds(true)
			.setBounce(1)
			.setDepth(1)
			.setDamping(10)
			.setMass(20)
			.setCircle(25);
		
		physicsMgr.add.overlap(coin, ball, function(){inputMgr.emit("score")});
		coin.body.onWorldBounds = true;	
		
		var p03 = scene.add.particles('flares');
		var emitter3 = p03.createEmitter({
				emitZone:{
					type: 'random',
					source: new Phaser.Geom.Circle(coin.x, coin.y, 25),
					seamless: true,
					yoyo: true,
					quantity: 15,
				},
				blendMode: 'HUE',
				maxParticles:15,
				speed: {min: 20, max: 60 },
				acceleration: true,
				accelerationX: coin.body.velocity.x/2,
				accelerationY: coin.body.velocity.y/2,
				lifespan: {min: 300, max: 350},
				angle: 360,
				bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
				collideBottom: true, collideTop: true, collideLeft: true, collideRight : true,
				scale: { start: 0.3, end: 0 },
				quantity: {min: 1, max: 5},
				alpha: {min:.05, max: .15},
				deathCallback: function(){emitter3.setAlpha(0)},
			});
		emitter3.manager.setDepth(2);
	}
	
	//drop timer
	icenter = scene.add.circle(0, 0, ball.body.width/100, 0xffffff);
	ileft = scene.add.circle (0, 0 , ball.body.width/100, 0xffffff);
	iright = scene.add.circle (0, 0, ball.body.width/100, 0xffffff);
	scene.tweens.add({
		targets: [icenter, ileft, iright],
		alpha: 0,
		duration: 0,
		ease: 'Circular'
	}, scene);
}

function update (){		
	//drop timer follow & fade out
	icenter.x = ball.x;
	icenter.y = ball.y - 100;
	ileft.x = icenter.x - 20
	ileft.y = icenter.y
	iright.x = icenter.x + 20
	iright.y = icenter.y
	
	switch(itimer){
		case 3:
			scene.tweens.add({
				targets: iright,
				alpha: 0,
				duration: dropTime/3,
				ease: 'Circular'
			}, this);
			break;
		case 2:
			scene.tweens.add({
				targets: icenter,
				alpha: 0,
				duration: dropTime/3,
				ease: 'Circular'
			}, this);
			break;
		case 1:
			scene.tweens.add({
				targets: ileft,
				alpha: 0,
				duration: dropTime/3,
				ease: 'Circular'
			}, this);
			break;
	}
	
	//no playing the game with the site open
	if(isHidden){
		ball.setInteractive();
		inputMgr.setDraggable(ball)}
	else{
		ball.removeInteractive();
	}
	
	//spin the ball when thrown or rolling
	if(ball.body.velocity.x != 0){
		ball.body.setAngularVelocity(ball.body.velocity.x);
	}
	
	//spin the coin while moving
	(ball.body.velocity.x != 0) ? coin.body.setAngularVelocity(coin.body.velocity.x/4):null;

	//mess with the rain when you throw the ball
	pRain.setGravityX(-ball.body.velocity.x/3);
	pRain.setGravityY(ball.body.velocity.y+2000);
	
	//scaling
	pRain.setBounds(-250, 0, window.innerWidth+500, window.innerHeight);
	physicsMgr.world.setBounds(0,0,window.innerWidth,window.innerHeight,true,true,true,true);
	
	//should it rain?
	($('#rainCheck').prop("checked") == true) ? pRain.start() : pRain.stop();
}

window.addEventListener('DOMContentLoaded', function(){
	checkMobile();	
});

//HIDE TOGGLES---------------
var isHidden = false;
$("#hide, #hideAlt, #curtain").click(function(){
	$("#content").slideToggle();
	$(".options").slideToggle();
	if(!isHidden){
		$(".home").slideToggle(200);
		$("#hide").css({transform: "rotate(45deg)"});
		setTimeout(function(){$("#hide").css("opacity", "0%")}, 400);
		$("#hideAlt").css("display", "block");
		setTimeout(function(){$("#website").css("pointer-events", "none")}, 400);
		setTimeout(function(){$("#hideAlt").css("opacity", "100%")}, 400);
		$('#game').css("filter","blur(0px)");
		$('#score').css("filter","blur(0px)");
		$('#score').css("opacity","20%");
		$('.footer').css("pointer-events", "none");
		$('.footer').animate({bottom: "-25%"}, 500, "swing");
		scene.scene.resume();
		isHidden = true;
	}
	else{
		$(".home").slideToggle(100);
		$("#hideAlt").css("display", "none");
		$("#hideAlt").css("opacity", "0%");
		$("#hide").css({transform: "rotate(0deg)"});
		$("#hide").css("opacity", "100%");
		$("#website").css("pointer-events", "initial");
		$('#game').css("filter","blur(12px)");
		$('#score').css("filter","blur(20px)");
		$('#score').css("opacity","5%");
		$('.footer').css("pointer-events", "initial");
		$('.footer').animate({bottom: "0%"}, 500, "swing");
		scene.scene.pause();
		isHidden = false;
	}
});

//RESIZE HANDLING---------------
window.addEventListener("resize", function(){	
	game.scale.resize(window.innerWidth, window.innerHeight);
});

//NON-PHASER LISTENER EVENTS---------------
window.addEventListener("load", function(){
	$("#loading").fadeOut()
	setTimeout(function(){
		$("#loading").css("display", "none");
		//console.clear();
	}, 400);
});

$(".photoImg").on("load", function(){
	$(this).fadeOut(0);
	$(this).fadeIn();
})

$('#frame').scroll(function(){
	($('#frame').scrollTop() > 17) ? $('#top').fadeIn(200) : $('#top').fadeOut(200);
})

window.addEventListener("resize", checkMobile);

function checkMobile(){
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		$("#aboutGrid").removeClass("gridOffset").addClass("gridAlt");
		$(".grid").removeClass("grid").addClass("gridAlt");
		$("#switch1").addClass("gridAlt");
	}	
}

//ROTATING NAME AND PFP---------------
var names = ["GM, my name is Velada", "I'm the patron saint of blunts"]
var profiles = ["./bin/images/velada2.jpg", "./bin/images/velada.jpg"]

function rotateName() {
  var tick = $("#nTicker").data("name") || 0;
  $("#nTicker")
	.data("name", tick == names.length -1 ? 0 : tick + 1)
	.text(names[tick])
	.slideDown(450)
	.delay(7000)
	.slideUp(450);
	
  $("#pTicker")
	.data("name", tick == profiles.length -1 ? 0 : tick + 1)
	.attr("src", profiles[tick])
	.fadeIn(450)
	.delay(7000)
	.fadeOut(450, rotateName);
}
$(rotateName);
$("#pTicker").click(rotateName);
