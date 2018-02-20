self.addEventListener("install", function(event) {
    self.skipWaiting();
    console.log("Installed", event);
});

self.addEventListener("activate", function(event) {
    console.log("Activated", event);
});

//self.addEventListener('fetch', function(event) {
//    console.log(event.request.url);
//});

self.addEventListener("push", function(event) {
    var message;
    console.log('push received');
    console.log("Push message event", event);

    try {
        message = JSON.parse(event.data.text());
        console.log("Push message text", event.data.text());

        return event.waitUntil(
            self.registration.showNotification(
                message.title,
                {
                    icon: message.icon,
                    body: message.body,
                    data: {
                        url: message.url
                    }
                }
            )
        );
    } catch (e) {
        console.warn(e);
    }
});

self.addEventListener("notificationclick", function(event) {
    console.log("notification clicked");
    console.log(event);
    console.log("action:" + event.action);
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
