var mapLink = '&copy; <a target="_blank" href="//openstreetmap.org">OpenStreetMap</a> Contributors';
var fontLink = '<a target="_blank" href="//fontawesome.io">Font Awesome by Dave Gandy - http://fontawesome.io</a>';
var authorLink = 'map created by <a target="_blank"href="//it.linkedin.com/in/danielegaliffa">Daniele Galiffa</a>';
var dataLink = 'source data: <a target="_blank" href="//www.comune.brindisi.it/brindisi/images/servizi_aggiuntivi/coronavirus/elenco_attivita_consegna_a_domicilio_27marzo.pdf">Comune di Brindisi</a> last updated on 2020.03.27';

var no_cache = Math.random().toString().replace(".","");
var data_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB7QuheI8mzSxqLWEHU0eRA7QlmICN3p18czaVEfFI_r9WNtRfQMK4cmWJr5yyIFi8hDHfaRLCXo9Z/pub?gid=0&single=true&output=tsv&p=' + no_cache;
var map = L.map('map').setView([40.6311103, 17.9287464], 14);

L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	{attribution: authorLink + ' | ' + dataLink + ' | ' + mapLink + ' | ' + fontLink,
        maxZoom: 18,}).addTo(map);

map._initPathRoot()    

var customPopup = "Mozilla Toronto Offices<br/><img src='//joshuafrazier.info/images/maptime.gif' alt='maptime logo gif' width='350px'/>";
var customOptions =
{
	'maxWidth': '500',
	'className' : 'custom'
};


var getPopupTemplate = document.getElementsByTagName("template");
var templates = {};
var markers = [];
for(var a=0;a<getPopupTemplate.length;a++){
	var itemID = getPopupTemplate[a].getAttribute("class");
	if(itemID != null){
		templates[itemID] = getPopupTemplate[a].innerHTML.trim();
	}
	getPopupTemplate[a].remove();
}

var _populateParams = function(p_template,p_obj){
	var str = p_template;
	for(var i in p_obj){
		str = str.replace(new RegExp("{"+i+"}",'g'), p_obj[i]);
	}
	return str;
}
var _getPopupContent = function(p_data){
	return _populateParams(templates['popup'],p_data);
}

function _validateEmail(p_email) 
{
 	return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(p_email));
}

var _formatData = function(p_value,p_key){
	var value = p_value.toString().trim();
	switch(p_key){
		case 'tel1':
		case 'tel2':
		case 'tel3':
		case 'whatsapp':
			if(value.substring(0,3) == "831"){
				return "+390831" + value.substring(4,value.length);
			}else{
				if(value.length > 10){
					if(value.substring(0,2) == "39"){
						return "+39" + value.substring(3,value.length);
					}else{
						if(value.substring(0,2) == "00"){
							return "+39" + value.substring(5,value.length);
						}
					}
				}
			}
			//if(value == ""){ value = "ciao"; };
			return (value != null && value != "")? "+39" + value : "";
		break;

		case 'www':
			if(value.substring(0,5) != "https"){
				return (value != null && value != "")? "https://" + value : "";
			}
		break;

		case 'email':
			return _validateEmail(value)? value : "" ;
		break;

		default:
			return p_value;
		break;
	}
}
//	cleanData
	//	0831	> 0831

var _mapData = function(p_data){
	var hashmap = {
		'name':'Esercente',
		'address':'Indirizzo',
		'tel1':'Telefono1',
		'tel2':'Telefono2',
		'tel3':'Telefono3',
		'notes':'Note',
		'email':'Email',
		'facebook':'Facebook',
		'www':'WWW',
		'whatsapp':'Whatsapp'
	}; 
	var data = {};
	for(i in hashmap){
		data[i] = "";
		if(p_data[hashmap[i]] != null){
			var value = _formatData(p_data[hashmap[i]],i);
			data[i] = value;
		}
	}
	return data;
}

var _setItemsVisibility = function(p_data){
	for(var i in p_data){
		_setItemVisibility(p_data,i);
	}	
}

var _setItemVisibility = function(p_data,p_prop){
	var value = (p_data[p_prop] == null || p_data[p_prop].toString().trim() == "");
	d3.select(".popup_" + p_prop).classed("hidden",value);
}

var _createMarker = function(p_data){
	var marker = L.marker([p_data.Lat, p_data.Lon]);
	marker.data = _mapData(p_data);
	marker.bindPopup(customPopup,customOptions).addTo(map);
	marker.on('click', function(){
		marker._popup.setContent(_getPopupContent(marker.data));
		_setItemsVisibility(marker.data);
	})
	return marker;
}


var report = function(state) {
  //console.log('Permission ' + state);
  if(state == 'granted'){
  	navigator.geolocation.getCurrentPosition(onPermissionSuccess,onPermissionError,geoSettings);
  }
}

var onPermissionError = function(){
	//console.log("ERROR");
};
var geoSettings = {
	"enableHighAccuracy": true
}
var onPermissionSuccess = function(p_obj){
	var d = {};
	d.Lat = p_obj.coords.latitude;
	d.Lon = p_obj.coords.longitude;
	if(d.Lat != null && d.Lon != null){
		markers.push(_createMarker(d));
	}
	console.log("DONE");
};

var _handlePermission = function() {
  navigator.permissions.query({name:'geolocation'}).then(function(result) {
    if (result.state == 'granted') {
      report(result.state);
    } else if (result.state == 'prompt') {
      report(result.state);      navigator.geolocation.getCurrentPosition(onPermissionSuccess,onPermissionError,geoSettings);
    } else if (result.state == 'denied') {
      report(result.state);
    }
    result.onchange = function() {
      report(result.state);
    }
  });
}

//	not needed now
//	_handlePermission();

d3.tsv(data_url, function(data) {
	data.forEach(function(d) {
		if(d.Lat != null && d.Lon != null){
			//markers.push(_createMarker(d));
		}
	})
	var group = L.featureGroup(markers).addTo(map);
	map.fitBounds(group.getBounds());
	d3.select("#map").classed("hidden",false);
	d3.select(".loader").remove();
});