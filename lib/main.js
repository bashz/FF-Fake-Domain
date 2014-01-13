// The main module of the Similare Domain Add-on.

var tabs = require('sdk/tabs');
var self = require("sdk/self");
var notifications = require("sdk/notifications");
var Request = require("sdk/request").Request;
var observer = require("sdk/deprecated/observer-service");
var {Ci, Cc, Cr} = require("chrome");
        var widgets = require("sdk/widget");
var pageMod = require("sdk/page-mod");
var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);
var mainWindow = wm.getMostRecentWindow("navigator:browser");



exports.main = function() {

    //reading config file 
    var config = self.data.load("config.json");
    Webservice = JSON.parse(config);

    //getting the fake domains List From the Webservice
    var List = new Array();
    var i = 0;
    var fakeDomaineList_withMalware = Request({
        url: Webservice['url'],
        onComplete: function(response) {
            for (var obj in response.json) {

                List[i] = response.json[obj];

                i++;

            }
        }
    }).get();




    //Adding Observer to watch HTTP Request
    Cc["@mozilla.org/observer-service;1"]
            .getService(Ci.nsIObserverService)
            .addObserver(
            {
                observe:
                        function(aSubject, aTopic, aData)
                        {
                            if ("http-on-modify-request" == aTopic)
                            {

                                //get Domain from the URL of the HTTP Request
                                var url = aSubject
                                        .QueryInterface(Ci.nsIHttpChannel)
                                        .originalURI.spec;


                                var pathArray = url.split('/');
                                var http = pathArray[0];
                                var domain = 'undefined';

                                //parsing -- getting only domain name 
                                if (http.match(/https?:/i)) {
                                    domain = pathArray[2];
                                } else {
                                    domain = pathArray[0];
                                }
                                if (domain.match(/^www\./i)) {
                                    domain = domain.replace(/^www\./, '');
                                }



                                for (var j = 0; j < List.length; j++) {

                                    if ((domain == List[j].domaine) && (List[j].malware == "1"))
                                    {

                                        //cancel all http request of other domain & sub domain
                                        aSubject.cancel(Cr.NS_BINDING_ABORTED);

                                        //close the tab and open the error message
                                        var currentTab = tabs.activeTab;
                                        tabs.open(self.data.url("text-entry.html"));
                                        currentTab.close();
                                        pageMod.PageMod({
                                            include: "resource://jid1-3kse2ci1fu9lmw-at-jetpack/http2/data/text-entry.html",
                                            contentScript: '  document.body.innerHTML = "<img src=logo-access.png /> </br> <h2> ' + domain + ' is a fake domain for ' + List[j].altern + ', it contains malwares too ! this web site has been blocked by Fake Domain Detector Plugin !! </h2>  <a class=green  href=http://' + List[j].altern + ' > to go to the original website click here  </a> <br/> <br/> <br/> <a href=resource://jid1-3kse2ci1fu9lmw-at-jetpack/http2/data/continue.html?site=' + List[j].domaine + ' class=red id=continue > to continue at your own  risks click here  </a> "  ; '
                                        });







                                    }
                                }
                            }
                        }
            }, "http-on-modify-request", false);



    //Detect when tab is opned and the document is ready

    tabs.on('load', function(tab) {




        //get Domain from the URL of the tab
        var pathArray = tab.url.split('/');
        var http = pathArray[0];
        var domain = 'undefined';

        //parsing -- getting only domain name 
        if (http.match(/https?:/i)) {
            domain = pathArray[2];
        } else {
            domain = pathArray[0];
        }
        if (domain.match(/^www\./i)) {
            domain = domain.replace(/^www\./, '');
        }
        //test if the domain is fake and contain no malwares 
        for (var k = 0; k < List.length; k++) {

            if ((domain == List[k].domaine) && (List[k].malware == "0")) {

                //notify user
                data = List[k].altern;
                var message = List[k].domaine + " is a fake domaine to " + List[k].altern;
                var nb = mainWindow.gBrowser.getNotificationBox();
                var n = nb.getNotificationWithValue('Fake-Domain-Detected');
                if (n) {
                    n.label = message;
                } else {
                    var buttons = [{
                            label: 'Go to the Original Domain',
                            accessKey: '',
                            popup: null,
                            callback: function() {
                                tabs.open(data);
                            }
                        }];

                    const priority = nb.PRIORITY_WARNING_HIGH;
                            nb.appendNotification(message, 'Fake-Domain-Detected',
                            'chrome://mozapps/skin/extensions/alerticon-info-negative.png',
                            priority, buttons);
                }

            }
            //continue at your own risks function 
            if (tab.url.match(/^resource:\/\/jid1-3kse2ci1fu9lmw-at-jetpack\/http2\/data\/continue\.html\?site=.*$/)) {
                var path = tab.url.split('?');
                var site = path[1].split('=');

                for (var l = 0; l < List.length; l++)
                {

                    if (List[l].domaine == site[1])
                    {

                        List[l].malware = "0";

                        var currentTab = tabs.activeTab;
                        tabs.open('http://' + site[1]);
                        currentTab.close();
                    }
                }

            }

        }
    });







};
