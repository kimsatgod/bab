document.addEventListener('DOMContentLoaded', function (e) {
    initialiseState()
})

// Once the service worker is registered set the initial state  
function initialiseState() {

    // 서비스 워커 지원 여부 검사
    var supported = true;
    if (!('serviceWorker' in navigator)) {
        // console.warn('Service Worker is NOT supported');
        supported = false;
    }
    // Are Notifications supported in the service worker?  
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        // console.warn('Notifications aren\'t supported.');
        supported = false;
    }

    // Check if push messaging is supported  
    if (!('PushManager' in window)) {
        // console.warn('Push messaging isn\'t supported.');
        supported = false;
    }

    if (!supported) {
        document.querySelector('#warning').style.display = 'initial';
        return false;
    }


    // Check the current Notification permission.  
    // If its denied, it's a permanent block until the  
    // user changes the permission  
    if (Notification.permission === 'denied') {
        // console.warn('The user has blocked notifications.');
        alert('사용자에 의해 알림 권한이 거부 되었습니다.\n 수동으로 해제하십시오.');
        return false;
    }



    // 서비스워커 등록
    navigator.serviceWorker
        .register('service.js')
        .then(function (reg) {
            // console.log(reg);
            return navigator.serviceWorker.ready;
        })
        .then(function (reg) {
            console.log('Service Worker is ready :^)', reg);

            reg.pushManager
                .subscribe({
                    userVisibleOnly: true
                })
                .then(function (sub) {
                    console.log('endpoint:', sub.endpoint);
                });
        })
        .catch(function (error) {
            console.log('Service Worker error :^(', error);
            alert('서비스 워커 오류 발생!');
        });



    // We need the service worker registration to check for a subscription  
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        // Do we already have a push message subscription?  
        serviceWorkerRegistration.pushManager.getSubscription()
            .then(function (subscription) {
                // Enable any UI which subscribes / unsubscribes from  
                // push messages.  
                var pushButton = document.querySelector('#btn');
                pushButton.disabled = false;

                if (!subscription) {
                    // We aren't subscribed to push, so set UI  
                    // to allow the user to enable push
                    pushButton.innerHTML = "구독하기";
                    pushButton.addEventListener('click', subscribe); // 이벤트 핸들러
                    return;
                }

                // Keep your server in sync with the latest subscriptionId
                sendSubscriptionToServer(subscription);

                // Set your UI to show they have subscribed for  
                // push messages  
                pushButton.innerHTML = "구독해제";
                isPushEnabled = true;
            })
            .catch(function (err) {
                console.warn('Error during getSubscription()', err);
            });
    });
}

function subscribe() {
    // Disable the button so it can't be changed while  
    // we process the permission request  
    var pushButton = document.querySelector('#btn');
    pushButton.disabled = true;

    navigator.serviceWorker.ready
        .then(function (serviceWorkerRegistration) {

            serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true
            })
                .then(function (subscription) {

                    // The subscription was successful  
                    isPushEnabled = true;
                    pushButton.textContent = '구독해제';
                    pushButton.disabled = false;

                    // TODO: Send the subscription.endpoint to your server  
                    // and save it to send a push message at a later date
                    return sendSubscriptionToServer(subscription);
                })
                .catch(function (e) {
                    if (Notification.permission === 'denied') {
                        // The user denied the notification permission which  
                        // means we failed to subscribe and the user will need  
                        // to manually change the notification permission to  
                        // subscribe to push messages  
                        console.warn('Permission for Notifications was denied');
                        pushButton.disabled = true;
                    } else {
                        // A problem occurred with the subscription; common reasons  
                        // include network errors, and lacking gcm_sender_id and/or  
                        // gcm_user_visible_only in the manifest.  
                        console.error('Unable to subscribe to push.', e);
                        pushButton.disabled = false;
                        pushButton.textContent = 'Enable Push Messages';
                    }
                });
        });
}

function unsubscribe() {
    var pushButton = document.querySelector('#btn');
    pushButton.disabled = true;

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        // To unsubscribe from push messaging, you need get the  
        // subscription object, which you can call unsubscribe() on.  
        serviceWorkerRegistration.pushManager.getSubscription().then(
            function (pushSubscription) {
                // Check we have a subscription to unsubscribe  
                if (!pushSubscription) {
                    // No subscription object, so set the state  
                    // to allow the user to subscribe to push  
                    isPushEnabled = false;
                    pushButton.disabled = false;
                    pushButton.textContent = 'Enable Push Messages';
                    return;
                }

                var subscriptionId = pushSubscription.subscriptionId;
                // TODO: Make a request to your server to remove  
                // the subscriptionId from your data store so you
                // don't attempt to send them push messages anymore

                // We have a subscription, so call unsubscribe on it  
                pushSubscription.unsubscribe().then(function (successful) {
                    pushButton.disabled = false;
                    pushButton.textContent = 'Enable Push Messages';
                    isPushEnabled = false;
                }).catch(function (e) {
                    // We failed to unsubscribe, this can lead to  
                    // an unusual state, so may be best to remove
                    // the users data from your data store and
                    // inform the user that you have done so

                    console.log('Unsubscription error: ', e);
                    pushButton.disabled = false;
                    pushButton.textContent = 'Enable Push Messages';
                });
            }).catch(function (e) {
                console.error('Error thrown while unsubscribing from push messaging.', e);
            });
    });
}


function sendSubscriptionToServer(subscription) {
    var endpoint = subscription.endpoint;
    var registration_id = endpoint.split(':')[2];
    console.log(registration_id);

    $.ajax({
        url: '//localhost:3000/register/' + registration_id,
        method: 'POST'
    }).then(function (msg) {
        if (msg.result === 'success') {
            //alert('')
        } else {
            alert('서버에 등록하는 중 에러가 발생했습니다.');
        }
    });
}