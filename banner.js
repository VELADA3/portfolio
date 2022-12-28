// JavaScript Document
//banner eye can follow the mouse
var banner = document.getElementById('banner');
var svgdoc;
var iris;

window.addEventListener("load", function(){
	setTimeout(function(){
		console.log("BANNER SVG LOADED");
		svgdoc = banner.contentDocument;
		iris = svgdoc.getElementById('IRIS')
		$(iris).css({ 
			'transform-origin': '1708.5276px 250px',
		});
		window.addEventListener("mousemove", function(){
			$(iris).css({
				"transform": 
				"translateX("+((event.pageX - (window.innerWidth/2))/10)+"px) translateY("+((event.pageY - (window.innerHeight/6))/10)+"px)"
			});
		});
	}, 100);	
}, false);