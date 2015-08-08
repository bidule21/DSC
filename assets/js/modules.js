Number.prototype.toFixedDown = function(digits) {
	var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
		m = this.toString().match(re);
		return m ? parseFloat(m[1]) : this.valueOf();
};

var modules = {
	draw: function(){
		var a_canvas = document.getElementById("grafik");
		var context = a_canvas.getContext("2d");

		function resize() {
			var width = $(".grafik").outerWidth(true)
			var height = $(".grafik").outerHeight(true)

			var ratio = a_canvas.width/a_canvas.height;
			var newHeight = width * a_canvas.width/a_canvas.height;

			if (newHeight > height) {
				width = height * a_canvas.height/a_canvas.width;
			}
			else {
				height = newHeight
			}



			a_canvas.style.top = ($("#modules").height() - height) / 2 + "px";
			a_canvas.style.width = width+'px';
			a_canvas.style.height = height+'px';
		}
		resize()

		window.addEventListener('load', resize, false);
		window.addEventListener('resize', resize, false);

		var zoom = {}
		var currentRing = {}

		function update(session){
			var serie = session.serieHistory[session.selection.serie]

			context.clearRect(0, 0, a_canvas.width, a_canvas.height);

			if (serie != undefined && serie.length != 0) {
				var scheibe = session.disziplin.scheibe
				var ringInt = serie[session.selection.shot].ringInt
				var ring = scheibe.ringe[scheibe.ringe.length - ringInt]
				if (ring){
					currentRing = ring
					zoom = ring.zoom
				}
				else {
					zoom = session.disziplin.scheibe.defaultZoom
				}
			}
			else {
				zoom = session.disziplin.scheibe.defaultZoom
			}

			drawScheibe(session.disziplin.scheibe)
			drawMode(session, session.disziplin.scheibe)
		}

		function drawScheibe(scheibe){
			var lastRing = scheibe.ringe[scheibe.ringe.length-1]
			for (var i = scheibe.ringe.length-1; i >= 0; i--){
				var ring = scheibe.ringe[i]

				context.globalAlpha = 1.0
				context.fillStyle = ring.color;
				context.beginPath();
				context.arc(lastRing.width/2*zoom.scale+zoom.offset.x, lastRing.width/2*zoom.scale+zoom.offset.y, ring.width/2*zoom.scale, 0, 2*Math.PI);
				context.closePath();

				context.fill();
				context.strokeStyle = ring.textColor
				context.lineWidth = 4;
				context.stroke();
				context.fillStyle = "black";

				if (ring.text == true){
					// context.font = (10*zoom.zoom.scale)+" px";
					context.font = "bold "+(scheibe.text.size*zoom.scale)+"px verdana, sans-serif";
					context.fillStyle = ring.textColor
					context.fillText(ring.value, (lastRing.width/2 - ring.width/2 + scheibe.text.left)*zoom.scale+zoom.offset.x, (lastRing.width/2+scheibe.text.width)*zoom.scale+zoom.offset.y);
					context.fillText(ring.value, (lastRing.width/2 + ring.width/2 + scheibe.text.right)*zoom.scale+zoom.offset.x, (lastRing.width/2+scheibe.text.width)*zoom.scale+zoom.offset.y);
					context.fillText(ring.value, (lastRing.width/2-scheibe.text.width)*zoom.scale+zoom.offset.x, (lastRing.width/2 + ring.width/2 + scheibe.text.down)*zoom.scale+zoom.offset.y);
					context.fillText(ring.value, (lastRing.width/2-scheibe.text.width)*zoom.scale+zoom.offset.x, (lastRing.width/2 - ring.width/2 + scheibe.text.up)*zoom.scale+zoom.offset.y);
				}
			}

			// Probeecke
			if (session.type == "probe"){
				context.beginPath()
				context.moveTo(1450,50)
				context.lineTo(1950,50)
				context.lineTo(1950,550)
				context.fillStyle = scheibe.probeEcke.color
				context.globalAlpha = scheibe.probeEcke.alpha
				context.fill();
			}

		}

		function drawShot(shot, scheibe, last){
			var lastRing = scheibe.ringe[scheibe.ringe.length-1]

			if (last){
				if (currentRing){
					context.fillStyle = currentRing.hitColor
					console.log(currentRing)
				}
				else {
					context.fillStyle = "#ff0000";
				}

				context.globalAlpha = 1.0

			}
			else {
				context.fillStyle = "#cccccc";
				context.globalAlpha = 0.5
			}
			context.beginPath();
			context.arc((lastRing.width/2 + shot.x/1000)*zoom.scale+zoom.offset.x, (lastRing.width/2 - shot.y/1000)*zoom.scale+zoom.offset.y, scheibe.kugelDurchmesser/2*zoom.scale, 0, 2*Math.PI);
			context.closePath();
			context.fill();
		}

		function drawMode(session, scheibe){
			var serie = session.serieHistory[session.selection.serie]
			if (serie){
				for (i in serie){
					if (i != session.selection.shot){
						drawShot(serie[i], scheibe, false)
					}
				}
				if (serie.length > session.selection.shot){
					var selectedShot = serie[session.selection.shot]
					drawShot(selectedShot, scheibe, true)
				}
			}
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	serien: function(){
		function update(session){
			$(".serien ul").html("")
			$(".serien").hide()

			for(i in session.serieHistory){
				var ringeSerie = 0
				for(ii in session.serieHistory[i]){
					ringeSerie += session.serieHistory[i][ii].ringInt
				}

				if (i == session.selection.serie){
					$(".serien ul").append("<li class='col-xs-3'><b>"+ringeSerie+"</b></li>")
				}
				else {
					$(".serien ul").append("<li class='col-xs-3' onclick=\"socket.emit('setSelectedSerie', '"+i+"')\">"+ringeSerie+"</li>")
				}
			}
			if (session.serieHistory.length > 0){
				$(".serien").show()
			}
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	aktuelleSerie: function(){
		function update(session){
			$(".aktuelleSerie table").html("")
			$(".aktuelleSerie").hide()

			var serie = session.serieHistory[session.selection.serie]

			if (serie){
				for (var i = 0; i < serie.length; i++){
					var shot = serie[i]

					var pfeil = "&#8635;"
					if (shot.ring < 10.3) {
						pfeil = "<span style='margin-top:-2.2vh; display:block; margin-top: 4%; transform-origin: 50% 50%; -webkit-transform:rotate(-"+Math.round(shot.winkel)+"deg)'> &#8594;</span>"
					}

					if (i == session.selection.shot){
						$(".aktuelleSerie table").append("<tr><td>"+(i+1)+".</td><td><b>"+shot.ring+"</b></td><td>"+pfeil+"</td></tr>")
					}
					else {
						$(".aktuelleSerie table").append("<tr onclick=\"socket.emit('setSelectedShot', '"+i+"')\"><td>"+(i+1)+".</td><td>"+shot.ring+"</td><td>"+pfeil+"</td></tr>")
					}
				}
				if (serie.length > 0){
					$(".aktuelleSerie").show()
				}
			}
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	ringeGesamt: function(){
		function update(session){
			var gesamt = 0
			var gesamtSerie = 0
			for(i in session.serieHistory){
				for(ii in session.serieHistory[i]){
					var ring = session.serieHistory[i][ii].ringInt
					gesamt += ring
					if (i == session.selection.serie) {
						gesamtSerie += ring
					}
				}
			}
			var textRingeM = "Ringe"
			var textRinge = "Ring"
			$(".ringeGesamt .value").text(gesamt + " " + ((gesamt==1) ? textRinge : textRingeM))
			$(".ringeGesamt .value2").text(gesamtSerie + " " + ((gesamt==1) ? textRinge : textRingeM))
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	aktuellerSchuss: function(){
		function update(session){
			$(".aktuellerSchuss .value").text("")
			$(".aktuellerSchuss .value2").text("")
			$(".aktuellerSchuss").hide()

			var serie = session.serieHistory[session.selection.serie]

			if (serie){
				if (session.selection.shot < serie.length){
					var shot = serie[session.selection.shot]

					$(".aktuellerSchuss .value").text(shot.ring)
					$(".aktuellerSchuss .value2").text((Math.round(shot.teiler*10)/10).toFixed(1) + " Teiler")

					$(".aktuellerSchuss").show()
				}
			}
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	anzahlShots: function(){
		function update(session){
			$(".anzahlShots .value").text("0")
			$(".anzahlShots .value2").text("0")

			var serie = session.serieHistory[session.selection.serie]

			var anzahl = 0
			for(i in session.serieHistory){
				anzahl += session.serieHistory[i].length
			}

			if (session.disziplin.anzahlShots == 0 || session.type == "probe"){
				$(".anzahlShots .value").text(anzahl)
			}
			else {
				$(".anzahlShots .value").text(anzahl + "/ "+session.disziplin.anzahlShots)
			}
			if (serie){
				$(".anzahlShots .value2").text(serie.length)
			}
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	schnitt: function(){
		function update(session){
			$(".schnitt .value").text("")
			$(".schnitt .value2").text("")
			$(".schnitt").hide()

			var gesamt = 0
			var anzahl = 0
			for(i in session.serieHistory){
				anzahl += session.serieHistory[i].length
				for(ii in session.serieHistory[i]){
					gesamt += session.serieHistory[i][ii].ringInt
				}
			}
			if (anzahl > 0){
				var schnitt = (Math.round(gesamt/ anzahl * 10)/ 10).toFixed(1)
				$(".schnitt .value").text(schnitt)

				if (session.disziplin.anzahlShots > 0){
					var textRingeM = "Ringe"
					var textRinge = "Ring"
					var hochrechnung = schnitt * session.disziplin.anzahlShots
					$(".schnitt .value2").text(Math.round(hochrechnung) + " " + ((hochrechnung==1) ? textRinge : textRingeM))
				}

				$(".schnitt").show()
			}
		}

		var moduleObject = {}
		moduleObject.newShot = function(shot, scheibe){
			update(session)
		}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	time: function(){
		var refreshIntervalId
		init()

		function n(n){
			return n > 9 ? "" + n: "0" + n;
		}

		function init(){
			clearInterval(refreshIntervalId)

			var refresh = function(){
				var date = new Date()
				$(".time .value").text(n(date.getHours())+":"+n(date.getMinutes())+":"+n(date.getSeconds())+" Uhr")
				$(".time .value2").text(n(date.getDate())+"."+n((date.getMonth()+1))+"."+n(date.getFullYear()))
			}
			refreshIntervalId = setInterval(refresh, 1000)
			refresh()
		}

		var moduleObject = {}
		return moduleObject
	},



	name: function(){
		$(".name").click(function(){
			$('#userMenu').modal('show')
		})
		$("#userMenu .menuItem").click(function(){
			$('#userMenu').modal('hide')
		})
		$("#userMenu .selectUser").click(function(){

		})
		$("#userMenu .selectUserGast").click(function(){
			socket.emit("setUserGast", {})
		})


		function update(session){
			$(".name .value").text(session.user.firstName + " " + session.user.lastName)
		}
		function updateConfig(config){
			$(".name .value2").text(config.stand.title)
		}

		var moduleObject = {}
		moduleObject.setSession = function(session){
			update(session)
		}
		moduleObject.setConfig = function(config){
			updateConfig(config)
		}
		return moduleObject
	},



	verein: function(){
		function update(session){
			$(".verein").hide()

			$(".verein .title").text("")
			$(".verein .value").text("")
			$(".verein .value2").text("")

			if (session.user.verein != "" || session.user.manschaft != ""){
				$(".verein").show()

				$(".verein .title").text("Verein")
				$(".verein .value").text(session.user.verein)
				$(".verein .value2").text(session.user.manschaft)
			}
		}

		var moduleObject = {}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},



	disziplin: function(){
		$(".disziplin").click(function(){
			$('#disziplinMenu').modal('show')
		})

		function update(session){
			$(".disziplin .value").text(session.disziplin.title)
			$(".disziplin .value2").text(session.disziplin.scheibe.title)
		}
		function updateConfig(config){
			$("#disziplinMenu .list-group").html("")
			for (var i in config.disziplinen){
				var disziplin = config.disziplinen[i]
				$("#disziplinMenu .list-group").append("<a class='menuItem type_"+i+" list-group-item'>" + disziplin.title + "<input type='hidden' value='"+i+"'" + "</a>")

				$("#disziplinMenu .type_"+i).click(function(){
					var key = $(this).find('input').val()
					console.log(key)
					socket.emit("setDisziplin", key)
				})
			}

			$("#disziplinMenu .menuItem").click(function(){
				$('#disziplinMenu').modal('hide')
			})
		}

		var moduleObject = {}
		moduleObject.setSession = function(session){
			update(session)
		}
		moduleObject.setConfig = function(session){
			updateConfig(session)
		}
		return moduleObject
	},





	restTime: function(){

		var refreshIntervalId

		function secondsToString(seconds){

			var numhours = Math.floor(seconds / 3600)
			var numminutes = Math.floor((seconds % 3600) / 60)
			var numseconds = (seconds % 3600) % 60

			var string = ""
			if(numhours > 0){ string += numhours.toFixedDown(0) + "h " }
			if(numminutes > 0){ string += numminutes.toFixedDown(0) + "m " }
			if(numseconds > 0){ string += numseconds.toFixedDown(0) + "s " }

			return string
		}

		function update(session){
			clearInterval(refreshIntervalId)

			var refresh = function(){
				$(".restTime").hide()

				$(".restTime .title").text("")
				$(".restTime .value").text("")
				$(".restTime .value2").text("")

				if(session.time.type == "full"){
					var date = (session.time.end - (new Date().getTime()))/1000

					$(".restTime").show()

					$(".restTime .title").text("Verbleibende Zeit")
					$(".restTime .value").text(secondsToString(date))
					$(".restTime .value2").text(secondsToString(session.disziplin.time.duration*60))
				}
			}
			refreshIntervalId = setInterval(refresh, 1000)
			refresh()
		}

		var moduleObject = {}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},




	switchToMatch: function(){

		function update(session){
			$(".switchToMatch").unbind()
			$(".switchToMatch .value").text("")
			$(".switchToMatch .value2").text("")

			if (session.type == "probe"){
				$(".switchToMatch .value").text("Probe")
				$(".switchToMatch .value2").text("")

				$(".switchToMatch").click(function(){
					socket.emit("switchToMatch", {})
				})
			}
			else if (session.type == "match"){
				$(".switchToMatch .value").text("Match")
			}
		}

		var moduleObject = {}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},

	newTarget: function(){

		function update(session){
			$(".newTarget").unbind()

			$(".newTarget").hide()

			$(".newTarget .title").text("")
			$(".newTarget .value").text("")
			$(".newTarget .value2").text("")

			if (session.type == "probe"){
				$(".newTarget").show()

				$(".newTarget .title").text("Scheibe")
				$(".newTarget .value").text("Neue Scheibe")
				$(".newTarget .value2").text("")

				$(".newTarget").click(function(){
					socket.emit("newTarget", {})
				})
			}
			else if (session.type == "match"){

			}




		}

		var moduleObject = {}
		moduleObject.setSession = function(session){
			update(session)
		}
		return moduleObject
	},


}
