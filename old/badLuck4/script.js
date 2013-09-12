window.onload = function(){

//-----------------------------------------------------------
// Utils
//-----------------------------------------------------------


function setVal(o , v){
	for(var k in v){
		o[k] = v[k];
	}
}

var M = Math,
	PI = M.PI;

//random number [0..n]
function rand(n){
	n++;
	return M.floor(n*M.random());
}

//Point class
function P(x, y){
    this.x = x || 0;
    this.y = y || 0;
};
P.prototype = {
	i: function(){
		this.x =0;
		this.y = 0;
	},
	l: function(){
		return M.sqrt(this.x * this.x + this.y * this.y);
	},
	n : function(d){
		var l = this.l();
		d = d || 1;
		this.x = (this.x / l) * d;
		this.y = (this.y / l) * d;
	},
	a: function(){
		return Math.atan2(this.y,this.x)
	},
	diff : function(p1,p2){
		this.x = p2.x-p1.x;
		this.y = p2.y-p1.y;
	},
	sum : function(p1,p2){
		this.x = p2.x+p1.x;
		this.y = p2.y+p1.y;
	}
};

//-----------------------------------------------------------
// Input
//-----------------------------------------------------------

//Set up key listener
function onkey(d ,e) {
	if (!e) e = window.e;
	var c = e.keyCode;
	if (e.charCode && c == 0)
		c = e.charCode;
	
	if(c==37) keys.l1 = d; //left
	if(c==38) keys.u1 = d; //up
	if(c==39) keys.r1 = d; //rigth
	if(c==40) keys.d1 = d; //down
	
	if(c==65 || c==81) keys.l2 = d; //a/q
	if(c==90 || c==87) keys.u2 = d; //z/w
	if(c==83) keys.d2 = d; //s
	if(c==68) keys.r2 = d; //d
	
};
document.onkeyup = function(e) { 
	onkey(0 , e); 
};
document.onkeydown = function(e) { 
	onkey(1 , e); 
};

//-----------------------------------------------------------
// Game Classes
//-----------------------------------------------------------


function Entity(t, w, h){
	this.pos = new P();
	this.center = new P();
	this.dir = new P();
	this.t = t;
	this.w = w;
	this.h = h;
	entities.push(this);
	this.setPos(0,0);
};
Entity.prototype = {
	move : function(v){
		if(v.x){
			this.pos.x += v.x;
			this.center.x = this.pos.x+this.w/2;
			if(v.x<-0.5){
				this.flip = true;
			}else if(v.x>0.5){
				this.flip = false;
			}
			//this.flip = v.x<0;
		}
		if(v.y){
			this.pos.y += v.y;
			this.center.y = this.pos.y+this.h/2;
		}
		this.lastVx = v.x;
		this.lastVy = v.y;
		
	} ,
	setPos : function(x,y){
		//console.log("setPos",x,y);
		this.pos.x = x;
		this.pos.y = y;
		this.center.x = this.pos.x+this.w/2;
		this.center.y = this.pos.y+this.h/2;
	},
	collides: function(e2){
		return (M.abs(this.center.x-e2.center.x) < this.w*0.5 + e2.w*0.5
			&& M.abs(this.center.y-e2.center.y) < this.h*0.5 + e2.h*0.5 )
	},
	render: function(){
		var x = ~~this.pos.x,
			y = ~~this.pos.y,
			s = this.skin,
			f = this.flip,
			sx = s.x ,
			sw = s.w ,
			rx = this.w*0.5 ,
			ry = this.h*0.25 ,
			i = img;
		
		//Draw shadow
		ctx.save(); // save state
        ctx.beginPath();
		ctx.translate(-camera+x+this.w*0.5-rx , y+this.h-ry-2);
        ctx.scale(rx, ry);
        ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);
        ctx.restore(); // restore to original state
		ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();
		
		//jumping
		var P = 24;
		if(isNaN(this.jumpCount)) this.jumpCount = rand(P)
		y = ~~(y - M.abs(M.sin(this.jumpCount*PI/P))*4 );
		this.jumpCount++;
		this.jumpCount = this.jumpCount%P;
		
		if(this.t==PLAYER){
			if(attack.on){
				f = attack.direction == -1;
				sx += 33;
				sw += 9;
			}
		}else if(this.t==CAT){
			if(this.flying){
				s = this.skin2; 
				sx = s.x;
				sw = s.w;
			}
		}
		
		if(f){
			ctx.save();
			ctx.translate(s.w, 0);
			ctx.scale(-1, 1);
		}
		if(this.hurtCount>0){
			this.hurtCount--;
			i = canvasRed;
		}
		ctx.drawImage(i , sx, s.y, sw , s.h,
				(-camera + x - s.dx)*(f?-1:1) , y - s.dy , sw , s.h);
		if(f){
			ctx.restore();
		}
		
		if(this.t==PLAYER){
			//draw clover 
			ctx.drawImage(img , 48+(4-player.luck)*16, 48, 16 , 16,
				f ? (-camera + x - 10):(-camera + x - 10) , y -21 , 16 , 16);
		}
		
		if(this.t==BOAR){
			ctx.fillStyle = "rgb(255,0,0)";
			var numDots = (~~this.rage);
			numDots *= numDots; // 0 1 2 4 8 16
			for(var i=0 ; i<numDots ; i++){
				sx = 58;
				if(f){
					sx = 16;
				}
				sx += -camera+x;
				ctx.fillRect(
				sx + 12*((M.random()+M.random())*0.5-0.5) ,
				y-2 + 8*((M.random()+M.random())*0.5-0.5)
				,2,1);
			}
		}
	},
	hurt : function(){
		this.hurtCount = 20;
	}
	
};
Entity.ySort = function(e1,e2){
	return (e1.pos.y+e1.h) - (e2.pos.y + e2.h);
};



//-----------------------------------------------------------
// Game
//-----------------------------------------------------------

var CAT = "c", PLAYER = "p", BOAR="b", ATTACK = "a",
	canvas = document.getElementById("c"),
	img = document.getElementById("img"),
	ctx = canvas.getContext("2d"),
	canvasBG = document.createElement("canvas"),
	canvasRed = document.createElement("canvas"),
	ctxRed = canvasRed.getContext("2d"),
	ctxBG = canvasBG.getContext("2d"),
	WIDTH = canvas.width = 800,
	HEIGHT = canvas.height = 600,
	entities = [],
	//player
	player = null,
	attack = null,
	//keys
	keys = {l:0 , u:0 , r:0 , d:0},
	cats = [],
	boars = [],
	pt = new P(),
	pt2 = new P(),
	pt3 = new P(),
	camera = 0,
	img;
	
(function prepareCanvas(){
	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled  = false;
	ctx.webkitImageSmoothingEnabled = false;

	//prepare canvases
	canvasRed.width = img.width;
	canvasRed.height = img.height;
	ctxRed.drawImage(img,0,0);
	ctxRed.fillStyle = "#f00";
	ctxRed.globalAlpha = 0.5;
	ctxRed.globalCompositeOperation = "source-atop";
	ctxRed.fillRect(0,0,img.width,img.height);

	//background
	canvasBG.width = 2*WIDTH;
	canvasBG.height = HEIGHT;
	var sliceW = 50 , nFlower = 50 , nSlice=WIDTH/sliceW;
	var i,j,x,y;
	//ctxBG.fillRect(0,0,WIDTH,HEIGHT);
	
	//Draw texture
	var nCol = Math.ceil(WIDTH/8),
		nRow = Math.ceil(HEIGHT/8);
	for(i=0 ; i<nCol ; i++){
		for(j=0 ; j<nRow ; j++){
			ctxBG.drawImage(img , 72+rand(40-8) , 64+rand(32-8) , 8 , 8,
				i*8 , j*8 , 8 ,8);
		}
	}
	//Draw flowers
	for(i=0 ; i<nSlice ; i++){
		for(j=0 ; j<nFlower ; j++){
			ctxBG.drawImage(img , 96+8*rand(1) , 0+8*rand(5) , 8 , 8,
				~~(i*sliceW+M.random()*(sliceW-8)) , ~~(M.random()*(HEIGHT-3)) , 8 ,8);
		}
	}
	
	//copy on second part
	ctxBG.drawImage(canvasBG , WIDTH , 0);
	//document.body.appendChild(canvasBG);
})();

	
	
function init(){
	camera = 0;
	entities = [];
	cats = [];
	boars = [];
	player = new Entity(PLAYER , 18 , 22 );
	player.skin = {x:24,y:0,w:32,h:47,dx:8,dy:24};
	player.setPos( WIDTH/2-player.w/2,
				   HEIGHT/2-player.h/2 );
	player.speed = 4;
	player.luck = 4;
	player.catAttached = 0;
	
	
	attack = {
		on : false,
		val: 0,
		max: 20,
		min: 18,
		recover: 1
	};
	attack.val = attack.max;
	
	while(cats.length < 34){
		var cat = new Entity(CAT, 19, 16);
		cat.skin = {x:0,y:0,w:21,h:32,dx:1,dy:16};
		cat.skin2 = {x:0,y:48,w:41,h:18,dx:12,dy:2};
		//cat.setPos( (rand(1)==0) ? -90 : WIDTH+74 , 
		//cat.setPos( -90 , 
		//			rand(HEIGHT-16) );
		setCatRandPos(cat);
		cats.push(cat);
		
		cat.speedX = 1+M.random()*0.2;
		cat.speedY = 1+M.random()*0.2;
		cat.repulsion = 0.5 + M.random()*0.5;
		cat.attraction = 1 + M.random()*0.5;
		
		cat.flySpeed = 8;
		cat.flying = false;
		cat.flyingDist = 0;
		
	}
	
	
	
	var numBoars = 12;
	while(boars.length<numBoars){
		//var boar = new Entity(BOAR, 32, 21);
		//boar.skin = {x:0,y:68,w:47,h:33,dx:4,dy:11};
		var boar = new Entity(BOAR, 64, 42);
		boar.skin = {x:0,y:102,w:97,h:67,dx:8,dy:22};
		
		
		boar.minSpeed = player.speed * (0.4 + M.random()*0.2); //base speed
		boar.maxSpeed = (player.speed*(1.1+Math.random()*0.1));
		boar.rage = 1*Math.random();
		boar.rageMax = 4;
		boar.rageIncr = 0.15/50 * (1+ 0.6*M.random());
		boar.minX = -20-Math.random()*60;
		boar.setPos(boar.minX, 
				(boars.length/numBoars)*HEIGHT);
				//M.random()*HEIGHT);
		boars.push(boar);
	}
}
function setCatRandPos(cat){
	if(true){
		//top / bottom
		cat.setPos( camera + (0.8 + 0.4*M.random())*WIDTH , M.random()>0.5 ? -50 : HEIGHT+20);
	}else{
		//right
		cat.setPos( camera + WIDTH+20+0.5*WIDTH*M.random() , M.random()*HEIGHT );
	}
}

function tic(){
	//console.log(attack.val);
	
	
	//move player
	pt.i();
	if(keys.l2){
		pt.x = -1;
	}else if(keys.r2){
		pt.x = 1;
	}
	if(keys.u2){
		pt.y = -1;
	}else if(keys.d2){
		pt.y = 1;
	}
	//pt.n(player.speed);
	var speed = player.speed;
	if(player.catAttached>1){
		speed -= (player.catAttached-1)*0.4
	}
	pt.x *= speed;
	pt.y *= speed;
	if(pt.y+player.pos.y < 0){
		pt.y = -player.pos.y
	}else if(pt.y+player.pos.y > HEIGHT-player.w){
		pt.y = HEIGHT-player.w-player.pos.y;
	}
	player.move(pt);
	
	
	for(i in cats){
		cat=cats[i];
		if(!cat.flying && !cat.attached && player.collides(cat)){
			//collide with cat -> push it
			//cat.move(pt);
			cat.attached = true;
			player.catAttached++;
		}
	}
	
	//player attack
	var keyDown = false;
	if(keys.l1 || keys.r1){
		keyDown = true;
		if(!attack.on && attack.val>attack.min){ 
			attack.on = true;
			attack.direction = keys.l1 ? -1 : 1;
		}
	}else{
		attack.on = false;
	}
	if(attack.on){
		if(attack.val>0){
			attack.val--;
		}else{
			attack.on = false;
		}
	}else{
		//cooldown
		if(!keyDown){
			attack.val = attack.max;
		}
		/*
		if(attack.val<attack.max){
			attack.val += attack.recover;
		}
		*/
	}
	
	//move cats
	var i,j,cat,cat2,dist,dist2,boar,boar2;	
	for(i in cats){
		cat=cats[i];
		
		//Player distance
		pt.diff(cat.center , player.center);
		dist = pt.l();
		
		
		if(attack.on){
			var shoot = false;
			if(cat.attached){
				/*
				if(cat.center.x<player.center.x && attack.direction==-1){
					shoot = true;
				}else if(cat.center.x>player.center.x && attack.direction==1){
					shoot = true;
				}
				*/
				shoot = true;
				if(shoot){
					cat.attached = false;
					player.catAttached--;
				}
			}else if(cat.pos.y<player.pos.y+player.h
					&& cat.pos.y+cat.h>player.pos.y){
				//shoot passing cat
				if(attack.direction == -1
					&& cat.pos.x+cat.w>player.pos.x-20 && cat.pos.x+cat.w<player.center.x){
					shoot = true;
				}else if(attack.direction == 1
					&& cat.pos.x<player.pos.x+player.w+20&& cat.pos.x>player.center.x){
					shoot = true;
				}
			}
			if(shoot){
				cat.flying = true;
				pt2.n();
				cat.dir.x = attack.direction;
				cat.dir.y = 0;
			}
		}
		
		
		if(cat.pos.x < camera - 100 ){
			//too far away -> place elsewhere
			setCatRandPos(cat);
			
			cat.flying = false;
			cat.attached = false;
		}
		
		if(cat.attached){
			pt.x = player.lastVx;
			pt.y = player.lastVy;
			cat.move(pt);
		}else if(!cat.flying){
			
			//Player attraction
			pt.n(cat.attraction);
			
			//Other cats repulsion
			pt3.i();
			for(j in cats){
				if(i!=j){
					cat2 = cats[j];
					if(!cat2.flying){
						pt2.diff(cat2.center,cat.center);
						dist2 = pt2.l();
						pt2.n();
						if(dist2<300){
							dist2 = ((300-dist2)/dist2);
							dist2 *= dist2;
							pt3.x += pt2.x*dist2;
							pt3.y += pt2.y*dist2;
						}
					}
				}
			}
			if(pt3.x!=0 && pt3.y!=0){
				pt3.n(cat.repulsion);
				pt.x += pt3.x;
				pt.y += pt3.y;
			}
			
			var speedX = cat.speedX;
			var speedY = cat.speedY;
			/*
			if(dist>200){
				if(dist>400){
					speedX = player.speed;
					speedY = player.speed;
				}else{
					dist = (dist-200)/(400-200);
					speedX = player.speed*dist+(1-dist)*speedX;
					speedY = player.speed*dist+(1-dist)*speedY;
				}
			}
			*/
			pt.x *= speedX;
			pt.y *= speedY;
			//move
			cat.move(pt);
			
			//Collsions
			pt.x = 0;
			pt.y*=-1;
			pt.n(2);
			if(cat.collides(player)){
				cat.move(pt);
			}
			for(j in boars){
				boar=boars[j];
				if(cat.collides(boar)){
					cat.move(pt);
				}
			}
			
		}else{
			//Flying cat
			pt.x = cat.dir.x*cat.flySpeed;
			pt.y = cat.dir.y*cat.flySpeed;
			cat.move(pt);
			
			//collide with other cats
			for(j in cats){
				cat2 = cats[j];
				if(cat!=cat2 && !cat2.flying){
					if(cat.collides(cat2)){
						cat2.flying = true;
						cat2.dir.x = cat.dir.x;
						cat2.dir.y = -cat.lastVy*10;
					}
				}
			}
			
			for(j in boars){
				boar=boars[j];
				if(cat.collides(boar)){
					boar.move(pt);
					boar.rage = 0;
					boar.hurt();
				}
			}
			
			/*
			cat.flyingDist+=2;
			if(cat.flyingDist > 200){
				cat.flyingDist = 0;
				cat.flying = false;
			}
			*/
		}
	}
	
	//move boars
	for(i in boars){
		boar=boars[i];
		
		
		if(boar.rage<boar.rageMax){
			boar.rage += boar.rageIncr;
		}
		speed = boar.rage/boar.rageMax;
		speed = (1-speed)*boar.minSpeed + speed*boar.maxSpeed;
		
		/*
		straight move
		pt.x = speed;
		pt.y = 0;
		boar.move(pt);
		*/
		
		
		//Player distance
		pt.diff(boar.center , player.center);
		dist = pt.l();
		pt.n();
		//boar.move(pt);
		
		//Other boars repulsion
		pt3.i();
		for(j in boars){
			if(i!=j){
				boar2 = boars[j];
				pt2.diff(boar2.center,boar.center);
				dist2 = pt2.l();
				pt2.n();
				if(dist2<300){
					dist2 = ((300-dist2)/300);
					//dist2 *= dist2;
					pt3.x += pt2.x*dist2;
					pt3.y += pt2.y*dist2;
				}
			}
		}
		if(pt3.y != 0){
			pt3.n(0.5);
			pt.sum(pt,pt3);
		}
		pt.n(speed);
		//if(i==0) console.log(pt3.x , pt3.y);
		boar.move(pt);
		
		
		//pt.x *= 3;
		//pt.y *= 3;
		pt2.x = 0;
		pt2.y = pt2.y;
		for(j in cats){
			cat = cats[j];
			if(!cat2.flying){
				if(cat.collides(boar)){
					cat.move(pt2);
				}
			}
		}
		
		pt.x *= 3;
		pt.y *= 3;
		if(boar.collides(player)){
			player.move(pt);
			player.luck --;
			boar.rage = 0;
			player.hurt();
			if(player.luck == 0) init();
		}
		
		if(boar.pos.x<camera+boar.minX){
			boar.setPos(camera+boar.minX , boar.pos.y);
		}
	}
		
	
	//update camera
	camera = M.max(camera , ~~(player.pos.x - WIDTH/2));
	//camera += player.speed * 0.9;
	if(camera<0) camera = 0;
	
	//ctx.fillStyle = "#8f6";
	//ctx.fillRect(0,0,WIDTH,HEIGHT);
	ctx.drawImage(canvasBG , -camera%WIDTH , 0); 
	
	//render
	entities = entities.sort(Entity.ySort);
	for(i in entities){
		entities[i].render();
	}
	
	//Night fx
	//ctx.fillStyle = "rgba(0,0,30,0.1)";
	//ctx.fillRect(0,0,WIDTH,HEIGHT);
	
	
	//loop
	window.requestAnimationFrame(tic);
};

//init game
init();
tic();


};