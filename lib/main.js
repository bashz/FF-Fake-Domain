var url = require("sdk/url");
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var widgets = require("sdk/widget");
var events = require("sdk/system/events");
var Request = require("sdk/request").Request;
var {Ci, Cc, Cr} = require("chrome");
var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var _ = require("sdk/l10n").get;
var ss = require("sdk/simple-storage");

//ss.storage.discovered = [{"name":"localhost","rule":"allowed"},{"name":"likedomain","rule":"forbiden"}];
if (!ss.storage.discovered)
  ss.storage.discovered = [];


exports.main = function() {
    var pageMod = require("sdk/page-mod");
    pageMod.PageMod({
        include: self.data.url("setting.html"),
        contentScriptFile: self.data.url("prefs.js"),
        onAttach: function(worker) {
            worker.port.emit("buildForm", ss.storage.discovered);
            worker.port.on("getFormPost", function(values) {
                ss.storage.discovered = values;
              });
        }
    });
    var menuPanel = require("sdk/panel").Panel({
        width:220,
        height:200,
        contentURL: self.data.url("menu.html")
    });
    var widget = widgets.Widget({
        id: "main-widget",
        label: "Fake Domain Plugin",
        contentURL: self.data.url("logo-min.png"),
        panel : menuPanel
    });
    //reading config file 
    var config = self.data.load("config.json");
    Webservice = JSON.parse(config);
    //getting the fake domains List From the Webservice
    var dbfakes = [];
    var fakes = [];
//    var i = 0;
//    Request({
//        url: Webservice['url'],
//        onComplete: function(response) {
//            for (var obj in response.json) {
//                dbfakes[i] = response.json[obj];
//                i++;
//            }
//        }
//    }).get();
    
    var test = {}, test2 = {};
    test.domain = "localhost";test.origin = "centerline";test.malware = "0";test.target_protocol = "http://";test.fake_protocol = "https://"
    test2.domain = "likedomain";test2.origin = "127.0.0.1";test2.malware = "1";test2.target_protocol = "https://";test2.fake_protocol = "http://";
    dbfakes.push(test);
    dbfakes.push(test2);
    
    function reloadFakes(){
        for (var i = 0; i < dbfakes.length; i++) {
            fakes[i] = dbfakes[i];
        }
    }
     
    function removeAllowed(){
        reloadFakes();
        for (var i = 0; i < fakes.length; i++) {
            for (var j = 0; j < ss.storage.discovered.length; j++){
                if (fakes[i].domain === ss.storage.discovered[j].name && ss.storage.discovered[j].rule === "allowed"){
                    fakes.splice(i,1);
                    break;
                }
            }
        }
    }
    
    function verifyFake(domain) {
        for (var i = 0; i < fakes.length; i++) {
            if (domain === fakes[i].domain) {
                var rule = false;
                for (var j = 0; j < ss.storage.discovered.length; j++){
                    if(fakes[i].domain === ss.storage.discovered[j].name){
                        rule = ss.storage.discovered[j].rule;
                    }
                }
                if(!rule){
                    ss.storage.discovered.push({"name":fakes[i].domain, "rule":"norule"});
                }
                if(rule === "forbiden"){
                    tabs.open({url: fakes[i].target_protocol + fakes[i].origin, isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                    return true;
                }
                else{
                    notify(i);
                    return true;
                }
            }
        }
        return false;
    }

    function notify(i) {
        var domain = fakes[i].domain;
        var origin = fakes[i].origin;
        var malware = fakes[i].malware === "1";
        var protocol = fakes[i].target_protocol;
        var fake_protocol = fakes[i].fake_protocol;
        var message = "";
        if (malware) {
            message = domain + " " + (_("is_fake_domain_of")) + " " + origin + ", " + (_("it_may_contains_malwares"));
        }
        else {
            message = domain + " " + (_("is_fake_domain_of")) + " " + origin;
        }
        console.log(message);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        var nb = mainWindow.gBrowser.getNotificationBox();
        var buttons = [
            {
                label: (_("Continue_at_your_own_risk")),
                accessKey: 'N',
                callback: function() {
                    fakes.splice(i, 1);
                    tabs.open({url: fake_protocol + domain, isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                }
            },
            {
                label: (_("Go_to_the_original_domain")),
                accessKey: 'O',
                callback: function() {
                    tabs.open({url: protocol + origin, isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                }
            }
        ];
        nb.appendNotification(message, "Fake-Domain-Detected",
                self.data.url("logo-min.png"),
                nb.PRIORITY_WARNING_HIGH, buttons);
    }
    events.on("http-on-modify-request", function(event) {
        removeAllowed();
        var channel = event.subject.QueryInterface(Ci.nsIHttpChannel).originalURI.spec;
        if (verifyFake(url.URL(channel).host)) {
            event.subject.cancel(Cr.NS_BINDING_ABORTED);
        }
    }, true);
};
