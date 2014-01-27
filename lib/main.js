var url = require("sdk/url");
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var events = require("sdk/system/events");
var Request = require("sdk/request").Request;
var {Ci, Cc, Cr} = require("chrome");
var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var _ = require("sdk/l10n").get;

exports.main = function() {
    //reading config file 
    var config = self.data.load("config.json");
    Webservice = JSON.parse(config);
    //getting the fake domains List From the Webservice
    var fakes = [];
    var i = 0;
    Request({
        url: Webservice['url'],
        onComplete: function(response) {
            for (var obj in response.json) {
                fakes[i] = response.json[obj];
                i++;
            }
        }
    }).get();
    
    function verifyFake(domain) {
        for (var i = 0; i < fakes.length; i++) {
            if (domain === fakes[i].domain) {
                notify(domain, fakes[i].origin, fakes[i].malware === "1", fakes[i].target_protocol,fakes[i].fake_protocol, i);
                return true;
            }
        }
        return false;
    }

    function notify(domain, origin, malware, protocol, fake_protocol, i) {
        var message = ""; 
        if (malware){
            message = domain + " " + (_("is_fake_domain_of")) + " " + origin + ", " + (_("it_may_contains_malwares"));
        }
        else{
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
                    fakes.splice(i,1);
                    tabs.open({url : fake_protocol + domain, isPrivate : require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                }
            },
            {
                label: (_("Go_to_the_original_domain")),
                accessKey: 'O',
                callback: function() {
                    tabs.open({url : protocol + origin, isPrivate : require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                }
            }
            ];
        nb.appendNotification(message, "Fake-Domain-Detected",
                self.data.url("logo-min.png"),
                nb.PRIORITY_WARNING_HIGH, buttons);
    }
    events.on("http-on-modify-request", function(event) {
        var channel = event.subject.QueryInterface(Ci.nsIHttpChannel).originalURI.spec;
        if (verifyFake(url.URL(channel).host)) {
            event.subject.cancel(Cr.NS_BINDING_ABORTED);
        }
    }, true);
};
