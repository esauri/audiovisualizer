/*
	Erick Sauri
	Audio Visualizer
	Rich Media Web App 2015
*/

// App
	(function(){
		"use strict";

		var NUM_SAMPLES = 256,
				SOUND_1 = "media/Toca Madera.mp3",
				SOUND_2 = 'media/Soñar es mi juego.mp3',
				SOUND_3 = "media/'Cause I'm a Man.mp3",
				SOUND_4 = 'media/Lux Aeterna.mp3',
				audioElement,
				analyserNode,
				canvasWidth,
				canvasHeight,
				inMobile,
			  canvas = document.querySelector('#canvas'),
			  ctx = canvas.getContext("2d"),
				topCanvas = document.querySelector('#topCanvas'),
				topCtx = topCanvas.getContext('2d'),
				offscreenCanvas,
				offscreenCtx,
				offscreenCanvas2,
				offscreenCtx2,
				offscreenCanvas3,
				offscreenCtx3,
				data,
				color,
				radius = 200,
				showRect = false,
				showLines = false,
				showBars = true,
				showParticles = false,
				paint = false,
				invert = false,
				tintRed = false,
				lines = false,
				frequency = true,
				waveform =false,
				delayAmount = 0.5,
				delayNode,
	      mouse,
				dragging = false,
				val,
				offset,
				particles,
				freqIndex,
				origin={};

		//Color Palette
			var $red = '#e74c3c',
				$orange = '#F66B34',
				$yellow = '#F2D639',
				$green = "#2E9F82",
				$aqua = "#80FFDB",
				$light_blue = '#4AA0D5',
				$blue = '#5480f1',
				$white = '#f3f6fa',
				$black = '#231f20',
				$dark = '#343434',
				$grey = '#D8E9F0',
				$gradient;
				var $alpha = 0.8;



		function init(){

			//make an offscreen canvas
			offscreenCanvas = document.createElement("canvas");
			offscreenCtx = offscreenCanvas.getContext('2d');
			offscreenCanvas2 = document.createElement("canvas");
			offscreenCtx2 = offscreenCanvas2.getContext('2d');
			offscreenCanvas3 = document.createElement("canvas");
			offscreenCtx3 = offscreenCanvas3.getContext('2d');
			//Check if window is resized
			window.addEventListener('resize', resizeCanvas, false);
			//initial resize canvas
			resizeCanvas();
			// get reference to <audio> element on page
			audioElement = document.querySelector('audio');

			// call our helper function and get an analyser node
			analyserNode = createWebAudioContextWithAnalyserNode(audioElement);

			// get sound track <select> and Full Screen button working
			setupUI();
            // load and play default sound into audio element
			playStream(audioElement,SOUND_1);
			color = $gradient;
			//Particles
			particles = [];
			//Make 100 particles and make them Particle objects
			for(var x = 0; x < 100; x++){
				var p = new Particle();
				particles.push(p);
			}
			// start animation loop
			update();


		}

		function setupUI(){
			document.querySelector("#trackSelect").onchange = function(e){
				playStream(audioElement,e.target.value);
			};
			document.querySelector("#colorSelect").onchange = function(e){

				if(e.target.value == 'gradient'){
					color = $gradient;
				}
				else{
					color= e.target.value;
				}
			};
			document.querySelector("#fsButton").onclick = function(){
				requestFullscreen(canvas);
			};
			document.querySelector("#radiusSlider").onchange = function(e){
				document.querySelector("#radiusSliderResults").innerHTML = e.target.value;
				radius = 200;
				radius *= e.target.value;
			}
			document.querySelector("#reverbSlider").onchange = function(e){
				document.querySelector("#reverbSliderResults").innerHTML = e.target.value + 's';
				delayAmount = e.target.value;
			}
			document.querySelector("#audioForm").onclick = function(e){
				if(e.target.value == 'frequency'){
					frequency = true;
					waveform = false;
				}
				else if(e.target.value == 'waveform'){
					frequency = false;
					waveform = true;
				}
			}

			document.getElementById("clear").onclick = function(){
				cleartopCanvas();
			};

			document.getElementById("save").onclick = function(){
				doExport();
			};
			checkception();
		}

		function update() {
			// this schedules a call to the update() method in 1/60 seconds
			requestAnimationFrame(update);
			delayNode.delayTime.value = delayAmount;

			/*
				Nyquist Theorem
				http://whatis.techtarget.com/definition/Nyquist-Theorem
				The array of data we get back is 1/2 the size of the sample rate
			*/

			// create a new array of 8-bit integers (0-255)
			data = new Uint8Array(NUM_SAMPLES/2);

			// populate the array with the frequency data
			// notice these arrays can be passed "by reference"

			// OR
			if(frequency){
				analyserNode.getByteFrequencyData(data);

			}
			else if(waveform){
				analyserNode.getByteTimeDomainData(data); // waveform data
			}
			// DRAW!
			clearCanvas();
			getGradient(canvasWidth);
			ctx.fillStyle = ctx.strokeStyle = topCtx.fillStyle = topCtx.strokeStyle = offscreenCtx.fillStyle = offscreenCtx.strokeStyle  = offscreenCtx2.fillStyle = offscreenCtx2.strokeStyle= offscreenCtx3.fillStyle = color;
			ctx.globalAlpha = topCtx.globalAlpha = offscreenCtx.globalAlpha = offscreenCtx2.globalAlpha = $alpha;
			// loop through the data and draw!
			for(var i=0; i<data.length; i++) {
				if(showRect){
					//Draw rects
					makeRects(i, data[i], data.length);
				}
				if(showBars){
					//draw bars
					var amplitude = radius/200;
					makeBars(i, data[i], data.length, amplitude);
				}
				if(showLines){
					//draw lines
					var amplitude = radius/200;
					makeLine(i, data[i], data.length, amplitude);
					makeReverseLine(i, data[i], data.length, amplitude);
				}
				if(paint){
					var percent = data[i]/255;
					val = radius * percent;
					topCtx.lineWidth = val;
					topCanvas.onmousedown = onMouseDown;
					topCanvas.onmousemove = onMouseMove;
					topCanvas.onmouseup = onMouseUp;
					topCanvas.onmouseout = onMouseOut;
				}
			}
			getOffScreenData();
			if(invert){
				manipulatePixels();
			}
		}

		function getOffScreenData(){
			if(showLines){
				//Top line canvas
				ctx.drawImage(offscreenCanvas, 0, 0);
				//Reverse line canvas
				ctx.drawImage(offscreenCanvas2, 0, 0);
			}
		}


		function makeLine(dataIndex, data, length, amp){
			var barWidth = canvasWidth/length;
			if(dataIndex == 0){
				offscreenCtx.beginPath();
				offscreenCtx.moveTo((barWidth) * dataIndex, canvasHeight/2);
			}
			else if(dataIndex < length - 1){
				offscreenCtx.lineTo((barWidth) * dataIndex, canvasHeight/2 - (data * amp));
				offscreenCtx.stroke();
			}
			else{
				offscreenCtx.lineTo(canvasWidth, canvasHeight/2);
				offscreenCtx.stroke();
				offscreenCtx.closePath();
			}
		}

		function makeReverseLine(dataIndex, data, length, amp){
			var barWidth = canvasWidth/length;
			if(dataIndex == 0){
				offscreenCtx2.beginPath();
				offscreenCtx2.moveTo((barWidth) * dataIndex, canvasHeight/2);
			}

			else if(dataIndex < length - 1){
				offscreenCtx2.lineTo((barWidth) * dataIndex, canvasHeight - (canvasHeight/2 - (data * amp)));
				offscreenCtx2.stroke();
			}

			else{
				offscreenCtx2.lineTo(canvasWidth, canvasHeight/2);
				offscreenCtx2.stroke();
				offscreenCtx2.closePath();
			}
		}
		function onMouseDown(e){
			dragging = true;
			topCtx.lineCap = 'round';
			//get Mouse position
			var mouse = getMouse(e);
			topCtx.beginPath();
			topCtx.moveTo(mouse.x, mouse.y);

		}

		function onMouseMove(e){
			//If not dragging move on
			//if(!paint || !dragging) return;

			//Get new mouse position
			var mouse = getMouse(e);
			origin.x = mouse.x;
			origin.y = mouse.y;
			if(dragging && paint){

			topCtx.lineTo(mouse.x, mouse.y);
			//stroke
			topCtx.stroke();
			}

		}

		function onMouseUp(e){
			dragging = false;
			topCtx.closePath();
		}

		function onMouseOut(e){
			dragging = false;
			topCtx.closePath();

		}

		function manipulatePixels(){
			//Get all of the rgba pixel data by grabbing the ImageData Object
			if(showBars || showLines || showRect || showParticles){
				var imageData = ctx.getImageData(0,0,canvas.width, canvas.height),
				data = imageData.data,
				length = data.length,
				width = imageData.width;

			//Loop through all the data
			for(var i = 0; i < length; i+=4){
                    var tempRed = data[i],
						tempGreen = data[i+1],
						tempBlue = data[i+2];
					data[i] = 255 - tempRed;
					data[i+1] = 255 - tempGreen;
					data[i+2] = 255 - tempBlue;
			}
			//Put modified image data back on canvas
			ctx.putImageData(imageData, 0, 0);
			}
		}

		function makeRects(index, dataIndex, length){
			var barSpacing = 1;
			var barHeight = 200;
			var topSpacing = 50;
			var barWidth = canvasWidth/length;
			// the higher the amplitude of the sample (bin) the taller the bar
			// remember we have to draw our bars left-to-right and top-down
			ctx.fillRect(index * (barWidth + barSpacing), canvasHeight/2 - dataIndex, barWidth, barHeight);
			//draw inverted bars
			ctx.fillRect(canvasWidth - index * (barWidth + barSpacing),canvasHeight/2 - dataIndex, barWidth, barHeight);
		}

		function makeBars(index,dataIndex, length, amp){
			ctx.lineWidth = 3;
			var lineSpacing = 0;
			var lineHeight = 200;
			var topSpacing = 50;
			var lineWidth = canvasWidth/length;
			// the higher the amplitude of the sample (bin) the taller the bar
			// remember we have to draw our bars left-to-right and top-down
			ctx.beginPath();
			ctx.moveTo(index * (lineSpacing + lineWidth), canvasHeight/2 - (dataIndex * amp));
			ctx.lineTo(index * (lineSpacing + lineWidth), canvasHeight/2 + (dataIndex * amp));
			ctx.closePath();
			ctx.stroke();

		}

		// HELPER
		function makeColor(red, green, blue, alpha){
   			var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   			return color;
		}

		//Checks Checkboxes CHECKCEPTION
		//Add you Checkbox statements here
		//If you are using booleans make sure the id of the element has the same name so
		function checkception(){
			//For Rects true by default

			var $showRect = document.getElementById('showRect'),
				$showBars = document.getElementById('showBars'),
				$showLines = document.getElementById('showLines'),
				$paint = document.getElementById('paint'),
				$invert = document.getElementById('invert');

			$showRect.onchange = function(e){
				if( e.target.checked){
					showRect = true;
				}
				else{
					showRect = false;
				}
			}

			$showBars.onchange = function(e){
				if( e.target.checked){
					showBars = true;

				}
				else{
					showBars = false;
				}
			}
			//For Lines
			$showLines.onchange = function(e){
				if( e.target.checked){
					showLines = true;
				}
				else{
					showLines = false;
				}
			}
			$paint.onchange = function(e){
				var $paintButtons = document.querySelector(".paint");
				if( e.target.checked){
					paint = true;
					$paintButtons.style.display = 'block';

				}
				else{
					paint = false;
					$paintButtons.style.display = 'none';

				}
			}
			$invert.onchange = function(e){
				if( e.target.checked){
					invert = true;
				}
				else{
					invert = false;
				}
			}
		}

		//returns a random number from min to max
		function getRandom(min, max) {
  			return Math.random() * (max - min) + min;
		}

			//This function will resize the canvas to window size
		function resizeCanvas(){
			//If window width > 768 we use the desktop version (always showing sidebar)
			if(window.innerWidth >= 960){
				offset = 300;
				inMobile = false;
			}
			//We are in mobile mode, there is no offset since sidebar is hidden
			else{
				offset = 0;
				inMobile = true;
			}
			canvasHeight = window.innerHeight;
			canvasWidth = window.innerWidth - offset;
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			topCanvas.width = canvas.width;
			topCanvas.height = canvas.height;
			offscreenCanvas.width = canvasWidth;
			offscreenCanvas.height = canvasHeight;
			offscreenCanvas2.width = canvasWidth;
			offscreenCanvas2.height = canvasHeight;
			offscreenCanvas3.width = canvasWidth;
			offscreenCanvas3.height = canvasHeight;
			//Gets the gradient from 0 to canvas width
			getGradient(canvas.width);
		}

		//Function to get a gradient takes in a width
		function getGradient(gradientWidth){
			var grad = ctx.createLinearGradient(0,0,gradientWidth,0);
				grad.addColorStop(0, $red);
				grad.addColorStop(1/6, $orange);
				grad.addColorStop(2/6, $yellow);
				grad.addColorStop(3/6, $green);
				grad.addColorStop(4/6, $aqua);
				grad.addColorStop(5/6, $light_blue);
				grad.addColorStop(1, $blue);
				$gradient = grad;
			return;
		}

        function clearCanvas(){
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
			offscreenCtx2.clearRect(0, 0, canvasWidth, canvasHeight);
        }

		function cleartopCanvas(){
		 	topCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        }

		function clearParticles(){
				offscreenCtx3.clearRect(0, 0, canvasWidth, canvasHeight);

		}
		function createWebAudioContextWithAnalyserNode(audioElement) {
			var audioCtx, analyserNode, sourceNode;
			// create new AudioContext
			// The || is because WebAudio has not been standardized across browsers yet
			// http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
			audioCtx = new (window.AudioContext || window.webkitAudioContext);

			// create an analyser node
			analyserNode = audioCtx.createAnalyser();

			/*
			We will request NUM_SAMPLES number of samples or "bins" spaced equally
			across the sound spectrum.

			If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz,
			the third is 344Hz. Each bin contains a number between 0-255 representing
			the amplitude of that frequency.
			*/

			// fft stands for Fast Fourier Transform
			analyserNode.fftSize = NUM_SAMPLES;

			// this is where we hook up the <audio> element to the analyserNode
			sourceNode = audioCtx.createMediaElementSource(audioElement);

			//create delaynode instance
			delayNode = audioCtx.createDelay();
			delayNode.delayTime.value = delayAmount;

			//connect source -> delaynode -> analysernode ->destination
			sourceNode.connect(delayNode);
			delayNode.connect(analyserNode);


			// here we connect to the destination i.e. speakers
			analyserNode.connect(audioCtx.destination);
			return analyserNode;
		}

		//Sets which audio to play
		function playStream(audioElement,path){
			audioElement.src = path;
			audioElement.play();
			audioElement.volume = 0.2;
			document.querySelector('#status').innerHTML = path;
		}

		 // FULL SCREEN MODE
		function requestFullscreen(element) {
			if (element.requestFullscreen) {
			  element.requestFullscreen();
			} else if (element.mozRequestFullscreen) {
			  element.mozRequestFullscreen();
			} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
			  element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
			  element.webkitRequestFullscreen();
			}
			// .. and do nothing if the method is not supported
		};

        function getMouse(e){
        var mouse = {} // make an object
            mouse.x = e.pageX - e.target.offsetLeft;
            mouse.y = e.pageY - e.target.offsetTop;
            return mouse;
        }

		function enable(e){
			e.removeAttribute("disabled", "false");
		}
		function disable(e){
			e.setAttribute("disabled", "true");
		}
		function doExport(){
		// open a new window and load the image in it
		// http://www.w3schools.com/jsref/met_win_open.asp
		var data = topCanvas.toDataURL();
		var windowName = "canvasImage";
		var windowOptions = "left=0,top=0,width=" + canvas.width + ",height=" + canvas.height +",toolbar=0,resizable=0";
		var myWindow = window.open(data,windowName,windowOptions);
		myWindow.resizeTo(canvas.width,canvas.height); // needed so Chrome would display image
	 }

		function Particle(){
					var particle = this;

					//constructor
					(function(){
						particle.position = {};
						makeParticle();
					})();

					//Make the particle and its vars
					function makeParticle(){
						particle.position.x = canvasWidth * Math.random();
						particle.position.y = Math.random() * -10;
						particle.scale = getRandom(1,10);
						particle.gravity = Math.random() * 2;

					}

					//Draw the particles
					particle.draw = function(){
						//If the particle reaches the button of the canvas reset it
						if(particle.position.y >= canvasHeight)
						{
							makeParticle();
						}
						var amp = radius/200;
						//Add gravity to position.y
						particle.position.y += particle.gravity;
						//Make it occilate
						//particle.position.x += (Math.sin(particle.position.y/10) * 2);
						//Draw it on third OS canvas
						offscreenCtx3.beginPath();
						offscreenCtx3.arc(particle.position.x, particle.position.y, particle.scale * amp, 0, 2 * Math.PI, false);
						offscreenCtx3.fill();
						offscreenCtx3.closePath();
					};
		}

		window.addEventListener("load",init);
	}());
