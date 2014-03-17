var table = document.getElementById("table");
self.port.on("buildForm", function(discovered) {
    for (var i = 0; i < discovered.length; i++) {
        var tr = document.createElement("tr");
        var tdDomain = document.createElement("td");
        var tdAllowed = document.createElement("td");
        var tdForbiden = document.createElement("td");
        var tdNoRule = document.createElement("td");
        var allowedRadio = document.createElement("input");
        var forbidenRadio = document.createElement("input");
        var noRuleRadio = document.createElement("input");
        tr.class = "tr" + (i % 2);
        tdDomain.class = "domain";
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
        tdDomain.appendChild(document.createTextNode(discovered[i].name));
        tdAllowed.appendChild(allowedRadio);
        tdAllowed.appendChild(document.createTextNode("Allowed"));
        tdForbiden.appendChild(forbidenRadio);
        tdForbiden.appendChild(document.createTextNode("Forbiden"));
        tdNoRule.appendChild(noRuleRadio);
        tdNoRule.appendChild(document.createTextNode("No Rule"));
        tr.appendChild(tdDomain);
        tr.appendChild(tdAllowed);
        tr.appendChild(tdForbiden);
        tr.appendChild(tdNoRule);
        table.appendChild(tr);
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



