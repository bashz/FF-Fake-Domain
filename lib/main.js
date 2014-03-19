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
var autoSave = require('sdk/simple-prefs').prefs['saveAnswer'];

if (!ss.storage.discovered)
    ss.storage.discovered = [];

exports.main = function() {
    var pageMod = require("sdk/page-mod");
    pageMod.PageMod({
        include: self.data.url("setting.html"),
        contentScriptFile: self.data.url("js/setting.js"),
        onAttach: function(worker) {
            worker.port.emit("buildForm", ss.storage.discovered, _("Continue_to_fake_domain"),_("Go_to_original_domain"),_("No_rule_set"));
            worker.port.on("getFormPost", function(values) {
                ss.storage.discovered = values;
            });
        }
    });
    var menuPanel = require("sdk/panel").Panel({
        width: 220,
        height: 200,
        contentURL: self.data.url("menu.html")
    });
    var widget = widgets.Widget({
        id: "main-widget",
        label: "Fake Domain Plugin",
        contentURL: self.data.url("images/logo-min.png"),
        panel: menuPanel
    });
    
    var config = self.data.load("config/config.json");
    Webservice = JSON.parse(config);
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
                var rule = false;
                for (var j = 0; j < ss.storage.discovered.length; j++) {
                    if (fakes[i].domain === ss.storage.discovered[j].name) {
                        rule = ss.storage.discovered[j].rule;
                        break;
                    }
                }
                if (!rule) {
                    ss.storage.discovered.push({"name": fakes[i].domain, "rule": "norule"});
                    rule = "norule";
                }
                if (rule === "allowed") {
                    return false;
                }
                notify(i, rule);
                return true;
            }
        }
        return false;
    }

    function notify(i, rule) {
        var domain = fakes[i].domain;
        var origin = fakes[i].origin;
        var malware = fakes[i].malware === "1";
        var protocol = fakes[i].target_protocol;
        var fake_protocol = fakes[i].fake_protocol;
        var message = "";
        var buttons = [];
        if (rule === "forbidden") {
            message = (_("Requests_to")) + " " + domain + " " + (_("are_auto_redirected_to")) + " " + origin + " " +
                    (_("as_set_on_the_addon_setting"));
            buttons = [
                {
                    label: (_("Change_setting")),
                    accessKey: 'C',
                    callback: function() {
                        tabs.open({url: self.data.url("setting.html"), isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                    }
                }
            ];
        }
        else {
            if (malware) {
                message = domain + " " + (_("is_a_fake_domain_of")) + " " + origin + ", " + (_("it_may_contains_malwares"));
            }
            else {
                message = domain + " " + (_("is_a_fake_domain_of")) + " " + origin;
            }
            buttons = [
                {
                    label: (_("Continue_at_your_own_risk")),
                    accessKey: 'N',
                    callback: function() {
                        fakes.splice(i, 1);
                        tabs.open({url: fake_protocol + domain, isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                        if (autoSave) {
                            for (var i = 0; i < ss.storage.discovered.length; i++) {
                                if (ss.storage.discovered[i].name === domain) {
                                    ss.storage.discovered[i].rule = "allowed";
                                }
                            }
                        }
                    }
                },
                {
                    label: (_("Go_to_the_original_domain")),
                    accessKey: 'O',
                    callback: function() {
                        tabs.open({url: protocol + origin, isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
                        if (autoSave) {
                            for (var i = 0; i < ss.storage.discovered.length; i++) {
                                if (ss.storage.discovered[i].name === domain) {
                                    ss.storage.discovered[i].rule = "forbidden";
                                }
                            }
                        }
                    }
                }
            ];
        }

        console.log(message);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        var nb = mainWindow.gBrowser.getNotificationBox();
        nb.appendNotification(message, "Fake-Domain-Detected",
                self.data.url("images/logo-min.png"),
                nb.PRIORITY_WARNING_HIGH, buttons);
        if (rule === "forbidden") {
            tabs.open({url: protocol + origin, isPrivate: require("sdk/private-browsing").isPrivate(tabs.activeTab)});
        }
    }
    events.on("http-on-modify-request", function(event) {
        var channel = event.subject.QueryInterface(Ci.nsIHttpChannel).originalURI.spec;
        if (verifyFake(url.URL(channel).host)) {
            event.subject.cancel(Cr.NS_BINDING_ABORTED);
        }
    }, true);
};
