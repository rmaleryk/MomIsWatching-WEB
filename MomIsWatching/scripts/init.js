
var map; // global map
var socket;
var markers = [];
var sosMarkers = [];
var routeMarkers = [];
var zones = [];
var zoneMarker = null;
var zoneRadius = null;

function initMap() {
    var odessa = new google.maps.LatLng(46.447416, 30.749160);

    map = new google.maps.Map(document.getElementById('map'), {
        center: odessa,
        zoom: 14
    });

}

// Инициализация ВебСокетов
if (typeof (WebSocket) !== 'undefined') {
    socket = new WebSocket("ws://momiswatching.azurewebsites.net/Subscriptions/MapSubscriptionHandler.ashx");
} else {
    socket = new MozWebSocket("ws://momiswatching.azurewebsites.net/Subscriptions/MapSubscriptionHandler.ashx");
}

socket.onopen = function() {
//	alert("Соединение установлено.");
};

socket.onerror = function(error) {
//	alert("Ошибка " + error.message);
};

socket.onmessage = function (msg) {
    var packet = JSON.parse(msg.data);

    // Добавляем в список девайсов, если его там нет
    if (markers[packet.DeviceId] == null) {

        $.ajax({
            url: '/Index/DeviceRow',
            success: function (data) {

                // Загружаем частичное представление
                $('#home .rectangle').append(data);

                // Добавляем или обновляем маркер
                addMarker(packet);

                // Ставим статус "онлайн" в списке девайсов
                $("#" + packet.DeviceId).children(".device_name").children("#status").attr("class", "online");
            }
        });
    }
    else {
        addMarker(packet); // Добавляем или обновляем маркер
        $("#" + packet.DeviceId).children(".device_name").children("#status").attr("class", "online");
    }

    $.ajax({
        url: '/Index/GetDeviceInfo',
        data: { 'id': packet.DeviceId },
        success: function (data) {

            
            if (data.Zones != "") {
                var zones = JSON.parse(data.Zones);
                
                var pos = new google.maps.LatLng(
                    parseFloat(zones.center.split(';')[0]),
                    parseFloat(zones.center.split(';')[1])
                );
                var cityCircle = new google.maps.Circle({
                    center: pos,
                    fillOpacity: 0.0,
                    radius: parseInt(zones.radius)
                });
                //var  bounds = cityCircle.getBounds()
                var devicePos = new google.maps.LatLng(
                    parseFloat(packet.Location.split(';')[0]),
                    parseFloat(packet.Location.split(';')[1])
                );
                
                var rez = null;
                console.log(distHaversine(devicePos, pos) * 1000);
                console.log(parseInt(zones.radius));
                if (distHaversine(devicePos, pos) * 1000 < parseInt(zones.radius))
                    $("#" + packet.DeviceId + " .device_name #name")[0].style.color = "#F00";
                else
                    $("#" + packet.DeviceId + " .device_name #name")[0].style.color = "#000";
                

                console.log(rez);
            }

        }
    });
    
   


};

socket.onclose = function (event) {
    if (event.wasClean) {
        //alert('Соединение закрыто чисто');
    } else {
        alert('[Error] Код: ' + event.code + ' причина: ' + event.reason);
    }
};

// Загрузка последних местоположений девайсов
$.ajax({
    url: '/Index/GetDeviceLastPosition',
    cache: false,
    success: function (packet) {
        for (var i = 0; i < packet.length; i++) {
            addMarker(packet[i]);
        }
    }
});

// TODO Реализовать отображения оффлайн устройств по проверке последнего обновления и их интервалов
// Делаем через некоторое время устройства оффлайн
// Пока что примитивно, но так...
setInterval(function () {

    $("*").children(".device_name").children("#status").attr("class", "offline");

}, 30000);

function addMarker(packet) {

    var myLatLng = { lat: parseFloat(packet.Location.split(';')[0]), lng: parseFloat(packet.Location.split(';')[1]) };

    // Добавляем маркер для этого девайса, если его нет
    //console.log(packet.DeviceId + " " +markers[packet.DeviceId]);
    if (markers[packet.DeviceId] == null) {
        markers[packet.DeviceId] = [];

        // Создаем кастомный пин и даем ему рандомный цвет
        var pinColor = getRandomColor();
        var markerimg = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•|" + pinColor;

        var pinImage = new google.maps.MarkerImage(markerimg,
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34));

        var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
            new google.maps.Size(40, 37),
            new google.maps.Point(0, 0),
            new google.maps.Point(12, 35));

        markers[packet.DeviceId]["marker"] = new google.maps.Marker({
            position: myLatLng,
            animation: google.maps.Animation.DROP,
            map: map,
            icon: pinImage,
            shadow: pinShadow
        });

        // Добавляем мини-маркер в список устройств
        $("#" + packet.DeviceId).children(".device_name").children(".minimarker").attr("src", markerimg);

        // Слушатель нажатия на маркер
        markers[packet.DeviceId]["marker"].addListener('click', function () {
            markers[packet.DeviceId]["marker"].setAnimation(null);

            if (markers[packet.DeviceId]["infoWindow"] != null)
                markers[packet.DeviceId]["infoWindow"].open(map, markers[packet.DeviceId]["marker"]);
        });

    } else {
        // Если есть, то меняем местоположение
        markers[packet.DeviceId]["marker"].setPosition(myLatLng);
    }

    // Если пакет пришел через вебсокеты, то с телефона время не отправляется,
    // поэтому допишем сами
    if (packet.Time == null) {
        var now = new Date;
        var utcTimestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

        packet.Time = utcTimestamp + "";
        

    }
   
    // Сохраняем последний пакет (на всякий случай)
    markers[packet.DeviceId]["lastPacket"] = packet;

    var contentString = ""; // Текст информационного окна

    // Если сигнал SOS - ПРЫГАЕМ!!, добавляем строчку в информационное окно
    if (packet.IsSos == 1) {
        markers[packet.DeviceId]["marker"].setAnimation(google.maps.Animation.BOUNCE);
        contentString += "<img class='device_option' src='/Content/img/sos.png' /> <u style='vertical-align: super;'>SOS Request!</u><br>";
    }
  
    contentString += "Charge: " + packet.Charge + "%<br>"
                   + "Time: " + new Date(parseInt(packet.Time.replace(/\D/g, ''))).toLocaleString();

    markers[packet.DeviceId]["infoWindow"] = new google.maps.InfoWindow({
        content: contentString
    });

}

function deviceClicked(id) {
    // Слушатель нажатия на девайс в списке

    if (markers[id]["marker"].animation != null) {

        markers[id]["marker"].setAnimation(google.maps.Animation.DROP);
        markers[id]["marker"].setAnimation(google.maps.Animation.BOUNCE);
    }
    else
        markers[id]["marker"].setAnimation(google.maps.Animation.DROP);

    map.panTo(markers[id]["marker"].position);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function openFirstScreen() {
    $('#second_screen').fadeOut();
    $('#home').fadeIn();

    var device = {};

    device["Id"] = -1;
    device["DeviceId"] = $("#second_screen .rectangle li .row #deviceId")[0].value;
    device["Name"] = $("#second_screen .rectangle li .row #name")[0].value;
    device["Interval"] = parseInt($("#second_screen .rectangle li .row #interval")[0].value);

    if ($("#second_screen .rectangle li .row #center")[0].value != "" &&
        $("#second_screen .rectangle li .row #radius")[0].value != "") {
        device["Zones"] = "{ \"center\" : \"" + $("#second_screen .rectangle li .row #center")[0].value +
            "\", \"radius\" :" + parseInt($("#second_screen .rectangle li .row #radius")[0].value) + "}";
    } else {
        device["Zones"] = "";
    }

    console.log(JSON.stringify(device));



    $.ajax({
        url: '/Index/SaveSettings',
        //data: { "DeviceId": device["DeviceId"], "Name": device["Name"], "Interval": device["Interval"], "Zones": { "center": device["Zones"]["center"], "radius": device["Zones"]["radius"] } },
        data: { "device" : JSON.stringify(device) },
        cache: false,
        success: function (packet) {

            $("#" + device["DeviceId"]).children(".device_name").children("#name")[0].innerHTML = device["Name"];
            zoneMarker.setMap(null);
            zoneMarker = null;
            zoneRadius.setMap(null);
            zoneRadius = null;
        }
    });

}

function openSecondScreen(device) {
    $('#home').fadeOut();
    $('#second_screen').fadeIn();

    $.ajax({
        url: '/Index/GetDeviceInfo',
        data: {'id' : device },
        success: function (data) {

            $("#second_screen .rectangle li .row #deviceId")[0].value = data.DeviceId;
            $("#second_screen .rectangle li .row #name")[0].value = data.Name;
            $("#second_screen .rectangle li .row #interval")[0].value = data.Interval;
            $("#second_screen .rectangle li .row #position")[0].value = markers[device]["marker"].position;

            if (data.Zones != "") {
                var zone = JSON.parse(data.Zones);
                $("#second_screen .rectangle li .row #center")[0].value = zone.center;
                $("#second_screen .rectangle li .row #radius")[0].value = zone.radius;
                dropMarker({
                    lat: parseFloat(zone.center.split(';')[0]),
                    lng: parseFloat(zone.center.split(';')[1])
                });

            } else {
                $("#second_screen .rectangle li .row #center")[0].value = "";
                $("#second_screen .rectangle li .row #radius")[0].value = "";
            }

        }
    });

}

function sosf(img) {
    if (img.classList.contains("disabled")) {
        img.classList.remove("disabled");

        sosMarkers[img.parentNode.parentNode.id] = [];

        $.ajax({
            url: '/Index/GetSosMarkers',
            data: { "id": img.parentNode.parentNode.id },
            cache: false,
            success: function (packet) {

                for (var i = 0; i < packet.length; i++) {

                    var current = packet[i];
                    sosMarkers[current.DeviceId][i] = [];

                    var myLatLng = {
                        lat: parseFloat(current.Location.split(';')[0]),
                        lng: parseFloat(current.Location.split(';')[1])
                    };

                    sosMarkers[current.DeviceId][i]["marker"] = new google.maps.Marker({
                        position: myLatLng,
                        //animation: google.maps.Animation.DROP,
                        map: map,
                        icon: markers[current.DeviceId]["marker"].icon
                    });

                    sosMarkers[current.DeviceId][i]["marker"].setOpacity(0.7);

                    // Слушатель нажатия на маркер
                    sosMarkers[current.DeviceId][i]["marker"].addListener('click',
                        function () {

                            var marker;
                            for (var i = 0; i < sosMarkers[img.parentNode.parentNode.id].length; i++) {
                                if (sosMarkers[img.parentNode.parentNode.id][i]["marker"] == this) {
                                    marker = sosMarkers[img.parentNode.parentNode.id][i];
                                }
                            }

                            if (marker["infoWindow"] != null)
                                marker["infoWindow"].open(map, marker["marker"]);
                        });

                    var contentString =
                        "<img class='device_option' src='/Content/img/sos.png' /> <u style='vertical-align: super;'>SOS Request!</u><br>" + "Charge: " + current.Charge + "%<br>"
                        + "Time: " + new Date(parseInt(current.Time.replace(/\D/g, ''))).toLocaleString();

                    sosMarkers[current.DeviceId][i]["infoWindow"] = new google.maps.InfoWindow({
                        content: contentString
                    });

                }

            }
        });

    } else {
        img.classList.add("disabled");

        // Удаление маркеров
        for (var i = 0; i < sosMarkers[img.parentNode.parentNode.id].length; i++) {

            sosMarkers[img.parentNode.parentNode.id][i]["marker"].setMap(null);
            sosMarkers[img.parentNode.parentNode.id][i]["marker"] = null;
            sosMarkers[img.parentNode.parentNode.id][i] = null;
        }
    }
}

function zonesf(img) {
    if (img.classList.contains("disabled")) {
        img.classList.remove("disabled");

        $.ajax({
            url: '/Index/GetZones',
            data: { "id": img.parentNode.parentNode.id },
            cache: false,
            success: function (packet) {

                if (packet == "") return;

                packet = JSON.parse(packet);
                console.log(packet.center);
                console.log(packet.radius);

                var color = markers[img.parentNode.parentNode.id]["marker"].icon.url.split('|')[1];
                var coordArr = (packet.center).split(";");
                var coord = { lat: parseFloat(coordArr[0]), lng: parseFloat(coordArr[1]) };
                zones[img.parentNode.parentNode.id] = new google.maps.Circle({
                    strokeColor: '#' + color,
                    strokeOpacity: 0.9,
                    strokeWeight: 2,
                    fillColor: '#' + color,
                    fillOpacity: 0.35,
                    map: map,
                    center: coord,
                    radius: parseInt(packet.radius)
                });

            }
        });

    } else {
        img.classList.add("disabled");

        if (zones[img.parentNode.parentNode.id] != null) {
            zones[img.parentNode.parentNode.id].setMap(null);
            zones[img.parentNode.parentNode.id] = null;
        }
    }
}

function positionf(img) {
    if (img.classList.contains("disabled")) {
        img.classList.remove("disabled");

        routeMarkers[img.parentNode.parentNode.id] = [];

        $.ajax({
            url: '/Index/GetMarkers',
            data: { "id": img.parentNode.parentNode.id },
            cache: false,
            success: function (packet) {

                for (var i = 0; i < packet.length; i++) {

                    var current = packet[i];
                    routeMarkers[current.DeviceId][i] = [];

                    var myLatLng = { lat: parseFloat(current.Location.split(';')[0]), lng: parseFloat(current.Location.split(';')[1]) };

                    routeMarkers[current.DeviceId][i]["marker"] = new google.maps.Marker({
                        position: myLatLng,
                        //animation: google.maps.Animation.DROP,
                        map: map,
                        icon: markers[current.DeviceId]["marker"].icon
                    });

                    routeMarkers[current.DeviceId][i]["marker"].setOpacity(0.7);

                    // Слушатель нажатия на маркер
                    routeMarkers[current.DeviceId][i]["marker"].addListener('click', function () {

                        var marker;
                        for (var i = 0; i < routeMarkers[img.parentNode.parentNode.id].length; i++) {
                            if (routeMarkers[img.parentNode.parentNode.id][i]["marker"] == this) {
                                marker = routeMarkers[img.parentNode.parentNode.id][i];
                            }
                        }

                        if (marker["infoWindow"] != null)
                            marker["infoWindow"].open(map, marker["marker"]);
                    });

                    var contentString = ""; // Текст информационного окна

                    // Если сигнал SOS - добавляем строчку в информационное окно
                    if (current.IsSos == 1) {
                        contentString += "<img class='device_option' src='/Content/img/sos.png' /> <u style='vertical-align: super;'>SOS Request!</u><br>";
                    }

                    contentString += "Charge: " + current.Charge + "%<br>"
                                   + "Time: " + new Date(parseInt(current.Time.replace(/\D/g, ''))).toLocaleString();
                    routeMarkers[current.DeviceId][i]["infoWindow"] = new google.maps.InfoWindow({
                        content: contentString
                    });
                }

                // Рисуем линию на карте

                var line = [];

                routeMarkers[img.parentNode.parentNode.id].forEach(function (item, i, arr) {
                    var coor = item["marker"].position;
                    line.push(coor);
                });

                var color = routeMarkers[img.parentNode.parentNode.id][0]["marker"].icon.url.split('|')[1];

                routeMarkers[img.parentNode.parentNode.id]["path"] = new google.maps.Polyline({
                    path: line,
                    geodesic: true,
                    strokeColor: '#' + color,
                    strokeOpacity: 1.0,
                    strokeWeight: 3
                });

                routeMarkers[img.parentNode.parentNode.id]["path"].setMap(map);

            }
        });

    } else {
        img.classList.add("disabled");

        // Удаление маркеров и линии

        routeMarkers[img.parentNode.parentNode.id]["path"].setMap(null);
        routeMarkers[img.parentNode.parentNode.id]["path"] = null;

        for (var i = 0; i < routeMarkers[img.parentNode.parentNode.id].length; i++) {

            routeMarkers[img.parentNode.parentNode.id][i]["marker"].setMap(null);
            routeMarkers[img.parentNode.parentNode.id][i]["marker"] = null;
            routeMarkers[img.parentNode.parentNode.id][i] = null;
        }
    }
}

function dropMarker(position) {
    console.log(zoneMarker);
    if (zoneMarker == null) {
        if (position == null) {
            var myLatLng = map.getCenter();
        }
        else {
            var myLatLng = position;
        }
        zoneMarker = new google.maps.Marker({
            position: myLatLng,
            Map: map,
            draggable: true
        });
        zoneMarker.setAnimation(google.maps.Animation.BOUNCE);
        var infowindow = new google.maps.InfoWindow({
            content: "Drag this marker to center of active zone"
        });
        infowindow.open(map, zoneMarker);
        zoneRadius = drawRadius(myLatLng, $("#second_screen .rectangle li .row #radius")[0].value);
        google.maps.event.addListener(zoneMarker, "dragend", function (event) {
            zoneMarker.setAnimation(null);
            var point = zoneMarker.getPosition();
            zoneRadius.setCenter(point);
            map.panTo(point);
        });
        google.maps.event.addListener(zoneMarker, "drag", function (event) {
            zoneMarker.setAnimation(null);
            var point = zoneMarker.getPosition();

            $("#second_screen .rectangle li .row #center")[0].value = point.lat() + ";" + point.lng();
            zoneRadius.setCenter(point);

        });
        ($("#second_screen .rectangle li .row #radius")).change(function () {
            zoneRadius.setRadius(parseInt($("#second_screen .rectangle li .row #radius")[0].value));
        });
    }
    else {
        map.panTo(zoneMarker.position);
    }
}

function drawRadius(point, radius) {
    var cityCircle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: point,
        radius: parseInt(radius)
    });
    return cityCircle;
}

function distHaversine(p1, p2) {
    var R = 6371; // earth's mean radius in km
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d.toFixed(3);
}
function rad (x) { return x * Math.PI / 180; }