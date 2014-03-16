var prefs = document.getElementById("prefs");
self.port.on("buildForm", function(discovered) {
    for (var i = 0; i < discovered.length; i++) {
        prefs.appendChild(document.createTextNode(discovered[i].name));
        var allowedRadio = document.createElement("input");
        var forbidenRadio = document.createElement("input");
        var noRuleRadio = document.createElement("input");
        allowedRadio.type = "radio";
        forbidenRadio.type = "radio";
        noRuleRadio.type = "radio";
        allowedRadio.id = "allowed" + "-" + discovered[i].name;
        forbidenRadio.id = "forbiden" + "-" + discovered[i].name;
        noRuleRadio.id = "norule" + "-" + discovered[i].name;
        if(discovered[i].rule === "allowed"){
            allowedRadio.checked = "true";
        }
        else if(discovered[i].rule === "forbiden"){
            forbidenRadio.checked = "true";
        }
        else{
            noRuleRadio.checked = "true";
        }
        allowedRadio.value = "allowed";
        forbidenRadio.value = "forbiden";
        noRuleRadio.value = "norule";
        allowedRadio.name = discovered[i].name;
        forbidenRadio.name = discovered[i].name;
        noRuleRadio.name = discovered[i].name;
        prefs.appendChild(allowedRadio);
        prefs.appendChild(document.createTextNode("Allowed"));
        prefs.appendChild(forbidenRadio);
        prefs.appendChild(document.createTextNode("Forbiden"));
        prefs.appendChild(noRuleRadio);
        prefs.appendChild(document.createTextNode("No Rule"));
        prefs.appendChild(document.createElement("br"));
    }
    document.onchange = function() {
        var values = [];
        for (var i = 0; i < discovered.length; i++) {
            var Radio = document.forms[0].elements[discovered[i].name];
            for (var j = 0; j < Radio.length; j++) {
                if (Radio[j].checked) {
                    values.push({"name":discovered[i].name,"rule":Radio[j].value});
                }
            }
        }
        self.port.emit("getFormPost", values);
    };
});



