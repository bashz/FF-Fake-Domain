var prefs = document.getElementById("prefs");
self.port.on("buildForm", function(discovered) {
    for (var i = 0; i < discovered.allowed.length; i++) {
        var radio = document.createElement("radio");
        radio.type = "checkbox";
        radio.id = "allowed" + i;
        radio.value = "allowed";
        prefs.appendChild(radio);
        prefs.appendChild(document.createTextNode(discovered.allowed[i]));
    }
    document.onchange = function() {self.port.emit("getFormPost", "allowed[i]")};
});



