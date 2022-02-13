// Example connect code
import {
  createLongLivedTokenAuth,
  createConnection,
  subscribeEntities,
  ERR_HASS_HOST_REQUIRED,
} from "home-assistant-js-websocket";
import WebSocket from "ws";
import fs from "fs";
import ini from "ini";
import dbus from "dbus-next";
import os from "os";

Object.assign(global, { WebSocket: WebSocket });

async function connect() {
  let bus = dbus.sessionBus();
  let obj = await bus.getProxyObject(
    'org.freedesktop.Notifications', '/org/freedesktop/Notifications');
  let notifications = obj.getInterface('org.freedesktop.Notifications');
  let auth;
  let config = ini.parse(fs.readFileSync(os.homedir() + "/.config/ha-notifier/config.ini", "utf-8"));

  // don't need to use long-lived token auth for this, see example for native auth
  // https://developers.home-assistant.io/docs/auth_api?_highlight=authorize#authorize
  auth = createLongLivedTokenAuth(config.hass_url, config.access_token);

  // TODO: switch to using oauth, register this just like a mobile app
  // add encryption support too?
  // add push_websocket_channel: true to the app_data object in registration
  // https://developers.home-assistant.io/docs/api/native-app-integration/setup

  const connection = await createConnection({ auth });

  connection.subscribeMessage(function(ev) {
    //console.log(ev);

    let summary;
    let body = "";
    if (typeof ev.title == "string" && ev.title.length > 0) {
      summary = ev.title;
      body = ev.message;
    } else {
      summary = ev.message;
    }
    notifications.Notify("HA Desktop Notifier", 0, "", summary, body, [], {}, 0);
  }, {
    type: "mobile_app/push_notification_channel",
    webhook_id: config.webhook_id,
  });
}

connect();
