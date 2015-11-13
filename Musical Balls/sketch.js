//arrays of objects
var movers = [];
var superLines = [];
var delayers = [];
var reverbs = [];

//mouse state counter (i can see 3 mice)
var mouseCount = 0;

//boolean switches
var booleanGravity = true;
var booleanDrag = false;

//vectors used for calculating strings and forces on movers
var current;
var previous;

//sliders!
var tempoSlider, delayTempoSlider;

//counter variables used for intersecting lines (blue ones)
var firstCounter = 0;
var secondCounter = 1;

//Delay object
var delay;

//y Posiition when hitting string dictates what note is played
var scaleArray = [95, 93, 92, 90, 88, 86, 85, 83, 81, 80, 78, 76, 74, 73, 71, 69, 68, 66, 64, 62, 61, 59, 54, 52, 50, 49, 47];

//used for the notes array
var scalable;

//ui size variable
var ui = 100;

//state that dictates how movers are added to sketch
var addMoverState = true;

//used to time movers being added
var timerSavedMillis;

//add movers according to timing (ms timer but will display bpm)
var timeTakesToAddNewMover;

function setup() {  
    //is javascript a science or an art?
    createCanvas(640,500);
    
    //scalable is a reallllly crap variable name, it pertains to the scale array
    //which is dictates the note played by a oscillator
    //the value is 400/8 = 50!
    scalable = (height - ui)/scaleArray.length;
    
    //framer8 is well rapid m8
    frameRate(60);

    //adds mover to start off with
    reset();

    //nothing to see here folks, just some vectors being initlised
    current = createVector(0,0);
    previous = createVector(0,0);
    
    /*
    //sliders aren't working - fix em
    tempoSlider = createSlider(0, 100, 0);
    tempoSlider.position(52, height + 20);
    delayTempoSlider = createSlider(0, 4000, 2000);
    delayTempoSlider.position(292, height + 20);
    */

    //set the timer for adding new movers
    timerSavedMillis = millis();
}

function draw() {
    // //being rubbish & not working atm
    // timeTakesToAddNewMover = tempoSlider.value();

	//black BG
    background(0);

    //ui display
    uiDisplay();

    fill(0, 20)
    rect(0, 0, width, height-ui);
    
    //manages all mover member methods and things like gravity and drag
    moverManager();

    //depending on state it will either add movers when no movers are there, or at a set timing
    autoAddMovers();

    //displays text depending on what mousestate user is in
    display();

    //displays mouse actions
    mouseActionDisplay();

    //handles superLines intersecting
    superLinesIntersect();
    
    //ball-string collision
    ballLineCollision();

    //manager for things like display, notes and adding movers
    delayManager();

    //manager for delayed ball collision (really sounds like it hurts)
    delayCollisionManager();

    //manager for reverb/ball collision and display function
    reverbManager();
}

function autoAddMovers() {

    //if state === true add movers when all movers are gone
    if (addMoverState) {
        //if no movers add a new one
        if (movers.length === 0) {
            reset();
        }

    } else {
        // there seems to be an issue with dom sliders and mouse events so the timing for adding movers has to be fixed for now
        /*
        //if time is up push new mover into array with following function
        if (addMoverTimer(tempoSlider.value())) {
            //new mover at normal spawn point
            newMover(1, 20, 20, 1, 0);
        }
        */
        if (addMoverTimer(500)) {
            //new mover at normal spawn point
            newMover(1, 20, 20, 1, 0);
        }
    }
}

function addMoverTimer(_millis) {
    //ms to bpm is: 60000 / millis = bpm
    var timerLimit = _millis;

    var timerMillisPassed = millis() - timerSavedMillis;

    if (timerMillisPassed > timerLimit) {
        timerSavedMillis = millis();
        return true;
    } else {
        return false;
    }
}

function uiDisplay() {
    var uiElements = 8;
    
    //1) draw grey background box
    
    fill(80);
    noStroke();
    rect(0, height - ui, width, ui);
    
    //2) draw ui element boxes
    
    //use loop to evenly space boxes
    for (var uie = 0; uie < uiElements; uie++) {
        fill(0);
        rect(uie*79+8, height - ui + 15, 70, 70);
    }

    //3) draw elements in boxes 

    stroke(0, 255, 0);
    strokeWeight(3);
    //i) String
    line(30, height - ui + 40, 55, height - ui + 55);
    //ii) Delay Box
    rect(112, height - ui + ui/2 - 10, 20, 20);
    //iii) Reverb Circle
    ellipse(200, height - ui + ui/2, 20, 20);
    //iv) Edit Mode
    stroke(255); //white
    strokeWeight(0.3); //thin stroke
    fill(255, 20); //translucent fill
    rect(273, height - ui + ui/2 - 7, 14, 14);
    //v) Mover Add Mode
    fill(0,255,0);
    noStroke();
    textAlign(CENTER);
    if (addMoverState) {
        text("Auto Add", 360, height - ui + ui/2 + 6);
    } else {
        text("BPM Add", 360, height - ui + ui/2 + 6);
    }
}

//general function for displaying text on mouse pressed
function fadeText(_string) {

    //spends more time black than white
    var fadeCol = map(sin(0.05*frameCount), 0, 1, 0, 255);

    noStroke();
    fill(fadeCol);
    textAlign(CENTER);
    text(_string, width/2, height - ui - 10);
}

function reverbManager() {
    for (var yu = 0; yu < movers.length; yu++) {

        for (var ty = 0; ty < reverbs.length; ty++) {

            //if in edit mode
            if (mouseCount === 4) {
                //check for edit mode
                reverbs[ty].edit(mouseX, mouseY);
            }

            //display circles for all reverb objects
            reverbs[ty].display();

            //check state to run timer if needed
            reverbs[ty].reverbAnimation();
            
            //check for collision
            reverbs[ty].collision(movers[yu].position.x, movers[yu].position.y, movers[yu].radius);

            if (reverbs[ty].collided === true) {
                
                // first make a noise like a string
                
                // i) we get an array element from 0 - 7 depending on y location of centre in delay rect(um)
                var reverbNote = floor(reverbs[ty].position.y+(0.5*reverbs[ty].size)/scalable)-1;
                // ii) we return a midi value from that
                var reverbMidiValue = scaleArray[reverbNote];
                // iii) we convert the midi value to a frequency
                var reverbFreqValue = midiToFreq(reverbMidiValue);
                    
                // second get that delay happening
                
                //send the oscillator the frequency
                reverbs[ty].osc.freq(reverbFreqValue);
                //tell envelope/oscillator to play
                reverbs[ty].reverbEnvelope.play();

                //finally tell reverb to run animation
                reverbs[ty].reverbTime = true;
            }
        }
    }
}

//nested loop to handle ball/delay collisions
function delayCollisionManager() {
    //for all of delay objects
    for (var de = 0; de < delayers.length; de++) {
        
        //had to get funky here

        //if there is only one mover, use normal loop
        if (movers.length <= 1) {

            for (var ew = 0; ew < movers.length; ew++) {
                delayers[de].collision(movers[ew].position.x, movers[ew].position.y, movers[ew].mass*16, movers[ew].velocity.x, movers[ew].velocity.y, movers[ew].position.x, movers[ew].position.y);
            }

        //if there is more than one mover, each time the delay spawns new mover, it's counter is reset, ensuing in infinite movers being spawned,
        //to combat this, the last mover tacked on to the movers array is not inputted into the method preventing this problem.
        } else {

            for (var re = 0; re < movers.length - 1; re++) {      
                delayers[de].collision(movers[re].position.x, movers[re].position.y, movers[re].mass*16, movers[re].velocity.x, movers[re].velocity.y, movers[re].position.x, movers[re].position.y);
            }
        }     
    }
}

//2 veg
function delayManager() {
    //for all delay objects in delayers array
    for (var p = 0; p < delayers.length; p++) {
        
        //if in edit mode then run member function allowing moving around
        if (mouseCount === 4) {
            delayers[p].edit(mouseX, mouseY);
        }

        //delay display member function
        delayers[p].display();

        //if delay object is collided
        if (delayers[p].repeatNextTime === true) {
            if (delayers[p].collided === true) {

                // first make a noise like a string
                // i) we get an array element from 0 - 7 depending on y location of centre in delay rect(um)
                var delayNote = floor(delayers[p].y+(0.5*delayers[p].ySize)/scalable)-1;
                // ii) we return a midi value from that
                var delayMidiValue = scaleArray[delayNote];
                // iii) we convert the midi value to a frequency
                var delayFreqValue = midiToFreq(delayMidiValue);
                
                // second get that delay happening
                //send the oscillator the frequency
                delayers[p].osc.freq(delayFreqValue);
                //tell envelope/oscillator to play
                delayers[p].delayEnvelope.play();
                delayers[p].repeatNextTime = false;
            }
        }      
        delayers[p].counterDelay();
    }
}


function ballLineCollision() {
    //nested loop for ball-superLine collision detection - not working atm
    for (var mv = 0; mv < movers.length; mv++) {
        for (var t = 0; t < superLines.length; t++) {
                
            //check for collisions
            superLines[t].collision(movers[mv].position.x, movers[mv].position.y, movers[mv].radius);
        
            //display dem lines
            superLines[t].display();
            
            // //if any of lines have been collided into
            if (superLines[t].collided === true) { 
                
                //firstly, dampening
                movers[mv].velocity.mult(0.95);

                //here we calculate frequency of note to be pulled from array

                //1) we get an array element from 0 - 7 depending on height  - ui
                var note = floor(superLines[t].collidedYPos/scalable)-1;
                //2) we return a midi value from that
                var midiValue = scaleArray[note];
                //3) we convert the midi value to a frequency
                var freqValue = midiToFreq(midiValue);

                //prevent mover falling through string (most of the time anyway)
                //an improvement would be to move the mover x amt of pixels along the a perp. vec to the string 
                if (movers[mv].position.y > superLines[t].collidedYPos) {
                    movers[mv].position.y+=3;
                } else {
                    movers[mv].position.y-=3;
                }
                
                //send the oscillator the frequency
                movers[mv].oscillator.freq(freqValue);

                //tell envelope/oscillator to play
                movers[mv].envelope.play();

                //now bounce movers like they're hitting a wall

                //1) create vector from points from superLine
                var v1 = createVector(superLines[t].firstX, superLines[t].firstY);
                var v2 = createVector(superLines[t].secondX, superLines[t].secondY);
                
                //2) input vectors into bounce velocity function which returns new velocity into movers bounce member function
                movers[mv].bounce(bounceVelocity(movers[mv].velocity, v1, v2));
            }
        }
    }
}

//this function calculates a new velocity vector depending on mover velocity, and line position
function bounceVelocity(_mvVel, _v1, _v2) {
    //1) create vector out of superLine 'end' points
    var superLineNormal = p5.Vector.sub(_v2, _v1);
    //2) create perp. vector of superLine
    superLineNormal.rotate(-PI/2);
    //normalise the vector
    superLineNormal.normalize();

    //new veclicity
    var newVel = createVector(_mvVel.x, _mvVel.y);
                
    //new velocity = velocity + -2 * old velocity dot normal * normal
    newVel.add(superLineNormal.mult(newVel.dot(superLineNormal)).mult(-2));

    return newVel;
}

function superLinesIntersect() {
    //counter is increased each time a superLine is drawn with mouse release
    if (superLines.length >= 2) {

        //for when this was in a loop, leaving it as it may end up in one again
        if (secondCounter > superLines.length - 1) {
            secondCounter = 1;
            firstCounter = 0;
        }

        var x1 = superLines[firstCounter].firstX;
        var y1 = superLines[firstCounter].firstY;
        var x2 = superLines[firstCounter].secondX;
        var y2 = superLines[firstCounter].secondY;
        var x3 = superLines[secondCounter].firstX;
        var y3 = superLines[secondCounter].firstY;
        var x4 = superLines[secondCounter].secondX;
        var y4 = superLines[secondCounter].secondY;

        superLines[secondCounter].intersection(x1, y1, x2, y2, x3, y3, x4, y4);
        if (superLines[secondCounter].intersect === true) {
            superLines[firstCounter].intersect = true;
        }
        
    }
}

function moverManager() {
    //function to manage all the mover crap here
    for (var i = 0; i < movers.length; i++) {

        //if gravity is true
        if (booleanGravity) {
            // Gravity is scaled by mass here!
            var gravity = createVector(0, 0.5*movers[i].mass);
            // Apply gravity
            movers[i].applyForce(gravity);
        }

        //if mover is out of screen bounds, kill
        if (movers[i].position.y > height - ui) {
            movers.splice(i,1);
        } else if (movers[i].position.y < 0) {
            movers.splice(i,1);
        } else if (movers[i].position.x > width) {
            movers.splice(i,1);
        } else if (movers[i].position.x < 0) {
            movers.splice(i,1);
        }

        //dont bother if no movers left
        if (movers.length > 0) {
            // Update and display
            movers[i].update();
            movers[i].display();
        }
    }
}

//simple grphical representation of mouse actions
function mouseActionDisplay() {
    if ((mouseY <= height  - ui) && (mouseX < width)) {
        
        current.x = mouseX;
        current.y = mouseY;

        if ((mouseCount === 2) || (mouseCount === 3)) {
            //if drawing delay or reverb objects display point to guide user
            strokeWeight(3);
            stroke(255);
            point(current.x, current.y);
        }

        if (mouseIsPressed) {
            // draw either visual representation of force being applied
            // or superLines being added
            if (mouseCount === 0) {
                //display string being drawn
                strokeWeight(3);
                stroke(0,255,0);
                line(previous.x, previous.y, current.x, current.y);
            } else if (mouseCount === 1) {
                //if drawing forces draw a little white line
                strokeWeight(1);
                stroke(255);
                line(previous.x, previous.y, current.x, current.y);
            }
        } 
    }
}

function display(){
    //show text
    //note we skip 1 (which is draw vector force for all movers) because simon hates it boooooo
    if (mouseCount === 0) {
        fadeText("String");
    } else if (mouseCount === 2) {
        fadeText("Delay");
    } else if (mouseCount === 3) {
        fadeText("Reverb");
    } else if (mouseCount === 4) {
        fadeText("Edit Mode");
    } else if (mouseCount === 5) {
        fadeText("Mover Add Mode");
    }
}

function mousePressed() {
	//if within mover area boundaries
	if ((mouseY <= height - ui) && (mouseX < width)) {
        //store mouse position on the click as one point in superLine being drawn 
		previous.x = mouseX;
		previous.y = mouseY;
	}
    console.log(mouseX);
    //if within ui
    if ((mouseY <= height - 15) && (mouseY > height - ui + 15)) {
        //if within first ui box bounds
        if ((mouseX >= 8) && (mouseX <= 79)) {
            mouseCount = 0;
        }
        //if within second box bounds
        if ((mouseX >= 88) && (mouseX <= 158)) {
            mouseCount = 2;
        }
        //if with third...
        if ((mouseX >= 167) && (mouseX <= 237)) {
            mouseCount = 3;
        }
        //if the forth....
        if ((mouseX >= 246) && (mouseX <= 316)) {
            mouseCount = 4;
        }
        //fifth!?!.....
        if ((mouseX >= 325) && (mouseX <= 395)) {
            mouseCount = 5;
            addMoverState = !addMoverState;
        }
    }
    return false;
}

function mouseDragged() {
    //if resizing strings
    if (mouseCount === 4) { 
        //loop through the lot
        for (var bn = 0; bn < superLines.length; bn++) {
            superLines[bn].resize(mouseX,mouseY); //if mouse pressed in the resizing boxes, it will trigger boolean to allow resizing
        }
    }
}

function mouseReleased() {
	// if in canvas boundaries
	if ((mouseY <= height - ui) && (mouseX < width)) {
		// draw a superLine
		if (mouseCount === 0) {
	    	superLine = new SuperLine(current.x, current.y, previous.x, previous.y);
	    	superLines.push(superLine);
            //first and second counter are used to check if latest and latest-1 superline intersect
			firstCounter += 1;
			secondCounter += 1;
		} else if (mouseCount === 1) {
			// run function that calculates force from mouse drag
			userForce();
		} else if (mouseCount === 2) {
            //new delay object
            newDelay = new Delay(current.x - 10, current.y - 10, 20, 20);
            delayers.push(newDelay);
        } else if (mouseCount === 3) {
            newReverb = new Reverb(current.x - 10, current.y - 10);
            reverbs.push(newReverb);
        } else if (mouseCount === 4) {
            for (var bv = 0; bv < superLines.length; bv++) {
                //if mouse released end resizing for either line 'end'
                superLines[bv].selectFirst = false; 
                superLines[bv].selectSecond = false;
            }
        }
		return false;
	}
}

function userForce() {
	// calculate force from original mouse position to current position
    for (var i = 0; i < movers.length; i++) {
    	var theForce = current.sub(previous);
    	theForce.mult(0.05); 
    	// Apply force
    	movers[i].applyForce(theForce); 
    } 
}

//below are some boolean switch functions
function frictionB() {
	booleanDrag = !booleanDrag;
}

function gravityB() {
	booleanGravity = !booleanGravity;
}

function dragB() {
	mouseCount = (mouseCount + 1) % 5;
}

// pushes new mover object into the movers array
function newMover(_mass, _x, _y, _velX, _velY) {  	
    mover = new Mover(_mass, _x, _y, _velX, _velY);
    movers.push(mover);
}

// removes the first element from the movers array each time the function is called
function removeMover() {
	movers.splice(0,1);
}

// Restart all the Mover objects
function reset() {
    for (var i = 0; i < 1; i++) {
        movers[i] = new Mover(1, 20, 20, 1, 0); 
    }
}

//this will boost the respective mover that collides with it in the direction that the boost was drawn in
function Boost(_xPos1, _yPos1, _xPos2, _yPos2) {
    this.startPos = createVector(_xPos1, _yPos1);
    this.endPos = createVector(_xPos2, _yPos2);
    this.angle; //this should be the angle dervived from the vector to rotate the rect 
    
    //somewhere along here i need to create normalised vector in the direction of point 1 to point 2
    //this can then be scaled accordingly and the force can be applied to the mover if collided with
    //this could be displayed nicely if at a perp of the objects vector, a line ran up the arrow to display the forces direction.
}

Boost.prototype.display = function() {
    rect();

};

//this is a reverb object that animates when collided with
function Reverb(_xPos, _yPos) {
    this.position = createVector(_xPos, _yPos);
    this.size = 20;
    this.collided = false;
    this.reverbTime = false;
    
    this.red = 0;
    this.green = 0;
    this.alpha = 255;

    //instanciate the member timer method's timer
    savedMillis = millis();
     
    //has its own oscillator and reverb object to
    //prevent interference with other objects
    this.osc = new p5.SinOsc();

    //use same envelope as strings
    //P5 envelope with ADSR parameters
    this.reverbEnvelope = new p5.Env(0.01, 0.6, 0.1, 0.0);
    this.osc.amp(this.reverbEnvelope);

    //creating instances of reverb for the p5 object
    this.reverb = new p5.Reverb();
    this.reverb.process(this.osc, 3, 0.1);

    this.reverb.amp(3); // turn it up!
    //let there be life
    this.osc.start();   

    //used to revert back to normal display state after animation
    this.differenceInSize;
    this.differenceInAlpha;

    this.hasBeenSelected = false;
    this.selected = false;
}

Reverb.prototype.edit = function(_mouseX, _mouseY) {  
    
    //if mouse is pressed
    if (mouseIsPressed) {
        //is the delay object hasn't hasn't been selected to move check for mouse pressed inside delay's edit box boundaries
        if (!this.hasBeenSelected) {
            //these are the boundaries
            if ((_mouseX >= this.position.x - 21) && (_mouseX <= this.position.x - 12) && (_mouseY >= this.position.y - 21) && (_mouseY <= this.position.y - 12)) {
                //if user was successful at aiming the mouse they are rewarded by having the opportunity to move it
                this.hasBeenSelected = true;
            } 
        } else {
            //so essentially here if this.hasBeenSelected === true the delay box is drawn appropriately
            this.position.x = _mouseX + 21;
            this.position.y = _mouseY + 21;
        }
    } else {
        //else is mouse is not pressed down we can be sure that user is not intending to move delay box (yet!?!)
        this.hasBeenSelected = false;
    }
};

Reverb.prototype.timer = function(_secs) {
    //instanciate the timer
    totalMillis = _secs*1000;

    //timer time = current time - start time
    var passedMillis = millis() - savedMillis;

    //if timer timer is greater than defined timer time
    if (passedMillis > totalMillis) {
        //help me debug my crappy code
        console.log("reverb timer has finished");
        //update start time
        savedMillis = millis();
        //tell the conditional calling this that it is true
        return true;
    } else {
        //else don't jump the gun
        return false;
    }
};

Reverb.prototype.reverbAnimation = function() {
    //if time for reverb (collision === true)
    if (this.reverbTime) {
        //run timer for two secs
        if (this.timer(3)) {
            //when timer is up this.reverbTime equals false
            this.reverbTime = false;
        }
    }
};

Reverb.prototype.display = function() {
    //if collised with flash red
    if (this.collided === true) {
        this.red = 255;
        this.green = 0;
    } else {
        this.red = 0;
        this.green = 255;
    }

    //if animating get bigger and fade out in sync with the reverb hit
    if (this.reverbTime) {
        this.alpha -= 1.2;
        
        //catch it if it goes below 0
        if (this.alpha < 0) {
            this.alpha = 0;
        }
        this.size += 0.7;

        //store deltas for future animation use below
        this.differenceInSize = abs(this.size - 20);
        this.differenceInAlpha = abs(this.alpha - 255);

    } else {

        //catch the animation if it gets too carried away
        if (this.size < 20) {
            this.size = 20;
        }
        if (this.alpha > 255) {
             this.alpha = 255;
        }

        //if not corrent size fade into right size
        if ((this.size !== 20) || (this.alpha !== 255)) {
            //size can only be bigger so minus 3% of difference per frame (will be done in under 1 or 2 secs)
            this.size -= 0.03*this.differenceInSize;
            //alpha can only be less so plus 3% of difference per frame
            this.alpha += 0.03*this.differenceInAlpha;   

        } else {
            //display normally
            this.size = 20;
            this.alpha = 255;
        }
    }

    //if in edit mode, display edit squares
    if (mouseCount === 4) {
        this.selected = true;
    } else {
        this.selected = false;
    }

    //display here
    if (this.selected) {
        stroke(255); //white
        strokeWeight(0.3); //thin stroke
        fill(255, 20); //translucent fill
        rect(this.position.x - 21, this.position.y - 21, 7, 7); //rect near first xy
    }

    //display regular ass shit here
    stroke(this.red, this.green, 0, this.alpha);
    strokeWeight(3);
    fill(0);
    ellipse(this.position.x, this.position.y, this.size, this.size);
};

//function here that will calculate if collided with by a mover
Reverb.prototype.collision = function(_x, _y, _r) {
    // find distance between the two objects
    var xDist = _x - this.position.x;                                   
    var yDist = _y - this.position.y;  

    var distance = sqrt((xDist*xDist) + (yDist*yDist));  // diagonal distance

    if (_r/2 + this.size/2 > distance) {
        this.collided = true;
    } else {
        this.collided = false;
    }
};

//Delay object
function Delay(_x, _y, _xSize, _ySize) {
	//rectangle parameters
    this.x = _x;
	this.y = _y;
	this.xSize = _xSize;
	this.ySize = _ySize;

    //store collided mover's velocity to pass to new movers
    this.velocityCopyX = 0;
    this.velocityCopyY = 0;

    //store collided mover's location to spawn new movers in the correct place
    this.locationCopyX = 0;
    this.locationCopyY = 0;

    //has mover collided with this delay object?
    this.collided = false;
    this.repeatNextTime = false;

    //display colour values
    this.red = 0;
    this.green = 255;

    //has its own oscillator and delay object to
    //prevent interference with the string object
    this.osc = new p5.SinOsc();

    //use same envelope as strings
    //P5 envelope with ADSR parameters
    this.delayEnvelope = new p5.Env(0.01, 1, 0.1, 0.0);
    this.osc.amp(this.delayEnvelope);
    this.delay = new p5.Delay();
    //attatch delay to sine oscillator, link it with timer by using var totaltime
    this.delay.process(this.osc, 0.5, .7, 20000);
    //this.delay.setType('pingPong');
    //amplitude to monitor delay and to add balls according to delay signal
    this.amplitude = new p5.Amplitude();
    this.amplitude.setInput(this.osc);
    //let there be life
    this.osc.start();

    //starts at 10, brought down to zero if collided with
    //incremented by 1 every 500ms after 
    this.addCounter = 10;

    //delay timer variables
    this.savedTime = millis();
    this.totalTime = 500;
    this.passedTime;

    //this.selected is a boolean state to decide whtehr the user can edit the objects position
    this.selected = false;
    //if the user clicks within the small white edit box this shall be set to true
    this.hasBeenSelected = false;
    //if this.move is true the the delay will move in conjunction to the mouse position
    this.move = false;
}

Delay.prototype.counterDelay = function() {
    if (this.collided) {
        this.addCounter = 0;
    }

    //delay goes on for roughly 10 times before inaudiable
    if (this.addCounter < 10) {
        //this runs new mover function at delay objects location every 100ms
        //whilst delay is happening
        this.passedTime = millis() - this.savedTime;
        //has a second passed?
        if (this.passedTime > this.totalTime) {
            //mover added at the location of original mover with original mover's velocity
            newMover(1, this.locationCopyX, this.locationCopyY, this.velocityCopyX, this.velocityCopyY);
            //counter incremented
            this.addCounter = this.addCounter + 1;
            //timer reset
            this.savedTime = millis();
        }
    }
}

// displays a box for Delay
Delay.prototype.display = function() {
	
    fill(255, 0, 255);

    //control delay mover spawn rate here
    //this.totalTime = delayTempoSlider.value(); //sliders don't seem to work with certain mouse events at the moment so adding rate is fixed for now

    //(not so) pretty colours
    if (this.collided === true) {
        this.red = 255;
        this.green = 0;
    } else {
        this.red = 0;
        this.green = 255;
    }

    //display stuff
    stroke(this.red, this.green, 0);
	strokeWeight(3);
    fill(0);
	rect(this.x, this.y, this.xSize, this.ySize);

    //if in edit mode, display squares
    if (mouseCount === 4) {
        this.selected = true;
    } else {
        this.selected = false;
    }
    //display here
    if (this.selected) {
        stroke(255); //white
        strokeWeight(0.3); //thin stroke
        fill(255, 20); //translucent fill
        rect(this.x - 14, this.y - 14, 7, 7); //rect near first xy
    }
};

Delay.prototype.edit = function(_mouseX, _mouseY) {  
    
    //if mouse is pressed
    if (mouseIsPressed) {
        //is the delay object hasn't hasn't been selected to move check for mouse pressed inside delay's edit box boundaries
        if (!this.hasBeenSelected) {
            //these are the boundaries
            if ((_mouseX >= this.x - 14) && (_mouseX <= this.x - 7) && (_mouseY >= this.y - 14) && (_mouseY <= this.y - 7)) {
                //if user was successful at aiming the mouse they are rewarded by having the opportunity to move it
                this.hasBeenSelected = true;
            } 
        } else {
            //so essentially here if this.hasBeenSelected === true the delay box is drawn appropriately
            this.x = _mouseX + 14;
            this.y = _mouseY + 14;
        }
    } else {
        //else is mouse is not pressed down we can be sure that user is not intending to move delay box (yet!?!)
        this.hasBeenSelected = false;
    }
};

//function here that will calculate if collided with by a mover
Delay.prototype.collision = function(bx, by, r, moverVelX, moverVelY, moverLocX, moverLocY) {
    if ((bx + r > this.x) && (bx - r < this.x + this.xSize) && (by + r > this.y) && (by - r < this.y + this.ySize)) {
        this.velocityCopyX = moverVelX;
        this.velocityCopyY = moverVelY;
        this.locationCopyX = moverLocX;
        this.locationCopyY = moverLocY;
        this.collided = true;
    } else {
        this.collided = false;
        this.repeatNextTime = true;
    }
};

// string object with stupid ass name because of existing variables/methods already using string and line as name
function SuperLine(x1, y1, x2, y2) {
	//x/y points at the each end of the line/string
    this.firstX = x1;
	this.firstY = y1;
	this.secondX = x2;
	this.secondY = y2;
    //is the line intersecting with another line?
	this.intersect = false;
    //has the line been collided with by a mover?
	this.collided = false;
    //where in the y axis has the line been collided with? (to determine what note from the array scale is played)
	this.collidedYPos = 0;
    //display colours for visual representation of whats happening
	this.red = 0;
	this.green = 255;
	this.blue = 0;
    //has line been selected for resizing (will need to be changed to false once mouse function groundwork has been put in)
    this.selected = false;
    //couple of booleans to help with resizing lines, see resize member function for more..
    this.selectFirst = false;
    this.selectSecond = false;
}

// displays a superLine and colour for the superLine
SuperLine.prototype.display = function() {
	//if mover has collided with the string
    if (this.collided) {
        //display red
		this.green = 0;
		this.red = 255;
	} else {
        //display green
    	this.green = 255;
    	this.red = 0;
	}
    //if two strings are intersecting one another
	if (this.intersect) {
        //blueeeeee
		this.blue = 255;
	} else {
        //else no blueeeeee
		this.blue = 0;
	}
	stroke(this.red, this.green, this.blue);
    strokeWeight(3);
    line(this.firstX, this.firstY, this.secondX, this.secondY);

    //if in edit mode, display squares
    if (mouseCount == 4) {
        this.selected = true;
    } else {
        this.selected = false;
    }
    //display squares at the end of each point of each line for resizing
    if (this.selected) {
        stroke(255); //white
        strokeWeight(0.3); //thin stroke
        fill(255, 20); //translucent fill
        rect(this.firstX, this.firstY - 14, 7, 7); //rect near first xy
        rect(this.secondX, this.secondY - 14, 7, 7); //rect near second xy
    }
};

// this member function allows user to resize lines and is called in the mousePressed function
SuperLine.prototype.resize = function(_mouseX, _mouseY) {
    // if user has selected this line object (over the others)  
    if (this.selected) {
        //if neither end of the line has been selected check to see if user is clicking either end
        if ((!this.selectFirst) && (!this.selectSecond)) {
            //if in bounds of first.x/y moving rectangle
            if ((_mouseX <= this.firstX + 7) && (_mouseX >= this.firstX) && (_mouseY <= this.firstY - 7) && (_mouseY >= this.firstY - 14)) {
                this.selectFirst = true;
            }
            //if in bounds of second rect...
            if ((_mouseX <= this.secondX + 7) && (_mouseX >= this.secondX) && (_mouseY <= this.secondY - 7) && (_mouseY >= this.secondY - 14)) {
                this.selectSecond = true;
            }
        } 
        //if first x/y has been selected change respective params.
        if (this.selectFirst) {
            this.firstX = _mouseX;
            this.firstY = _mouseY + 14;
        }
        //if second x/y has been selected change respective params.
        if (this.selectSecond) {
            this.secondX = _mouseX;
            this.secondY = _mouseY + 14;
        }
    }
};

// mover to superLine collision detection, bx/by == ball x/y, d = ball size (radius)
SuperLine.prototype.collision = function(bx, by, d) {
	// first get the length of the superLine using the Pythagorean theorem
    var distX = this.firstX-this.secondX;
    var distY = this.firstY-this.secondY;
    var superLineLength = sqrt((distX*distX) + (distY*distY));

    // then solve for r
    var r = (((bx-this.firstX)*(this.secondX-this.firstX))+((by-this.firstY)*(this.secondY-this.firstY)))/pow(superLineLength, 2);

    // get x,y points of the closest point
    var closestX = this.firstX + r*(this.secondX-this.firstX);
    var closestY = this.firstY + r*(this.secondY-this.firstY);

    // to get the length of the superLine, use the Pythagorean theorem again
    var distToPointX = closestX - bx;
    var distToPointY = closestY - by;
    var distToPoint = sqrt(pow(distToPointX, 2) + pow(distToPointY, 2));

    // if that distance is less than the radius of the ball
    // and it is within the superLine y bounds then collision!!!
    if ((distToPoint <= d/2) && ((by <= this.firstY + 10) && (by >= this.secondY - 10) || (by >= this.firstY - 10) && (by <= this.secondY + 10)) && ((bx <= this.firstX + 10) && (bx >= this.secondX - 10) || (bx >= this.firstX - 10) && (bx <= this.secondX + 10))) {
        this.collidedYPos = by;
        this.collided = true;
    } else {
        this.collided = false;
    }
};

// changes boolean when superLines intersect - could be useful as a chord mode or something?
SuperLine.prototype.intersection = function(x1, y1, x2, y2, x3, y3, x4, y4) {
	// find uA and uB
    var uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    var uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

    // note: if the below equations is true, the superLines are parallel
    // ... this is the denominator of the above equations
    // (y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)

    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    	this.intersect = true;
    } else {
    	this.intersect = false;
    }
};

// mover object
function Mover(m,x,y,velX,velY) {
    this.mass = m;
    this.radius = 0;
    this.position = createVector(x,y);
    this.velocity = createVector(velX,velY);
    this.acceleration = createVector(0,0);
    this.newVel = createVector(0,0);
    //P5 envelope with ADSR parameters
    this.envelope = new p5.Env(0.01, 1, 0.1, 0.0);
    //osc var = sine osc
    this.oscillator = new p5.SinOsc();
    //osc has envelope now
    this.oscillator.amp(this.envelope);
    //let there be life
    this.oscillator.start();
    this.alpha = 127;
    //max speed
    this.maxSpeed = 13;
}

// Newton's 2nd law: F = M * A
// or A = F / M
Mover.prototype.applyForce = function(force) {
    var f = p5.Vector.div(force,this.mass);
    this.acceleration.add(f);
};

Mover.prototype.bounce = function(_vec) {
    //set velocity with new velocity calculated
    this.velocity.set(_vec);
};
  
Mover.prototype.update = function() {
    // Velocity changes according to acceleration
    this.velocity.add(this.acceleration);
    // speed limit to prevent glitches (i.e falling through strings because travelling too fast and collision detection cannot detect at the
    // current frame per second speed)
    if (this.velocity.y > this.maxSpeed) {
        this.velocity.y = this.maxSpeed;
    }
    // position changes by velocity
    this.position.add(this.velocity);
    // We must clear acceleration each frame
    this.acceleration.mult(0);
};

Mover.prototype.display = function() {
    //directly mapping size to y velocity value
    this.radius = map(abs(this.velocity.y), 20, 0, 5, this.mass*16*2);
    //display circle :)
    stroke(0);
    strokeWeight(2);
    fill(255,this.alpha);
    ellipse(this.position.x,this.position.y,this.radius,this.radius);
};