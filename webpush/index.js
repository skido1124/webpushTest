$(document).ready(function(){
    var isLocalhost = (location.hostname === "localhost" || location.hostname === "127.0.0.1");

    if ("serviceWorker" in navigator &&
        (window.location.protocol === "https:" || isLocalhost)) {
        // ServiceWorker 登録
        navigator.serviceWorker.register("/webpush/service_worker.js").then(
            function (registration) {
                if (typeof registration.update == "function") {
                    console.log('registration update');
                    registration.update();
                }

                initialiseState();
            }).catch(function (error) {
            console.error("Service Worker registration failed: ", error);
        });
    }

    function initialiseState() {
        console.log('initialState');
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            console.warn('WebPush非対応');
            return;
        }

        if (Notification.permission === 'denied') {
            console.warn('WebPushブロック中');
            return;
        }

        if (!('PushManager' in window)) {
            console.warn('WebPush非対応');
            return;
        }

        // プッシュサーバへ購読登録
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration){
            console.log('serviceWorker ready');
            serviceWorkerRegistration.pushManager.getSubScription().then(
                function (subscription) {
                    console.log('get subscription');
                    console.log(subscription);
                    if (!subscription) {
                        console.warn('getSubscription error');
                    }
                    requestPermission();
                }
            );
        });
    }

    $('.notification-allow').on('click', function(){
        requestPermission();
    });

    $('.notification-deny').on('click', function(){
        unsubscribed();
    });

    function requestPermission() {
        console.log('request permission');
        Notification.requestPermission(function(permission) {
            console.log(permission);
            if (permission !== "denied") {
                subscribe();
            } else {
                alert("プッシュ通知を有効にできません。ブラウザの設定を確認して下さい。");
            }
        });
    }

    // プッシュサーバに購読登録 → AP サーバに送信
    function subscribe() {
        console.log('subscribe');
        navigator.serviceWorker.getRegistration("/webpush/service_worker.js").then(function(swr) {
            swr.pushManager.getSubscription().then(function(subscription){
                if (!subscription) {
                    var serverPublicKey = "BIAFhwtljl0lPkvqINDHAWrplCjfi4MTt0V3VuK-FHfPxKF_1SmgRmFCip74Zk_7z5O88rMqKkYynhuuuuh_tYI";
                    var key = urlBase64ToUint8Array(serverPublicKey);
                    console.log(key);
                    swr.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: key
                    }).then(
                        function (subscription) {
                            //console.log(subscription);
                            return sendSubscriptionToServer(subscription);
                        }
                    ).catch(function (e) {
                        if (Notification.permission == "denied") {
                            console.warn("Permission for Notifications was denied");
                        } else {
                            console.error("Unable to subscribe to push.", e);
                            window.alert(e);
                        }
                    });
                }
            });
        });
    }

    function unsubscribed() {
        console.log('unsubscribed');
        navigator.serviceWorker.getRegistration("/webpush/service_worker.js").then(function(swr) {
            swr.pushManager.getSubscription().then(
                function(subscription) {
                    if (!subscription ) {
                        return;
                    }

                    sendSubscriptionToServerForDelete(subscription);

                    subscription.unsubscribe().then(function(successful) {
                        console.log('success');
                    }).catch(function(e) {
                        console.error("Unsubscription error: ", e);
                    });
                }
            ).catch(
                function(e) {
                    console.error("Error thrown while unsubscribing from push messaging.", e);
                }
            );
        });
    }

    function sendSubscriptionToServer(subscription) {
        console.log('sending to server for regist:',subscription);
        var data = {
            end_point : subscription.endpoint,
            browser_key: encodeBase64URL(subscription.getKey('p256dh')),
            auth: encodeBase64URL(subscription.getKey('auth')),
            encoding: 'aesgcm'
        };
        console.log(data);

        if ('supportedContentEncodings' in PushManager) {
            data.encoding =
                PushManager.supportedContentEncodings.includes('aes128gcm') ? 'aes128gcm' : 'aesgcm';
        }

        //$.ajax({
        //    type: "POST",
        //    url: "/notification_web_push_keys/ajax_post_webpush_keys",
        //    dataType: "json",
        //    cache: false,
        //    data: data
        //}).done(function(){
        //    console.log('api success');
        //}).fail(function(){
        //    console.warn('api failed');
        //});
    }

    function sendSubscriptionToServerForDelete(subscrption) {
        //TODO サブスクリプションをサーバーから削除する処理
        console.log('sending to server for delete:', subscrption);
    }

    function encodeBase64URL(buffer) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function urlBase64ToUint8Array(base64String) {
        var dec = atob(base64String.replace(/\-/g, '+').replace(/_/g, '/'));
        var buffer = new Uint8Array(dec.length);
        for (var i = 0 ; i < dec.length ; i++)
            buffer[i] = dec.charCodeAt(i);
        return buffer;
    }
});
