var OneSignal = window.OneSignal || [];
var
    $sub = $('#subscribe'),
    $unsub = $('#unsubscribe'),
    $modify = $('#modifyTags')

OneSignal.push(["init", {
    appId: "c40a3ea7-6eb1-4664-93bc-4f71581b3381",
    safari_web_id: "web.onesignal.auto.4a2f472e-2de1-469e-8f55-0b3384f6ae6c",
    subdomainName: "bab79",
    autoRegister: false,
    notifyButton: {
        enable: false /* Set to false to hide */
    },
    promptOptions: {
        actionMessage: '다음과 같이 식전에 발송됩니다.',
        exampleNotificationTitleDesktop: '식단 알림',
        exampleNotificationMessageDesktop: '총 927 Kcal 무들깨국 스팸계란전 시금치나물 크림스프 김치',
        exampleNotificationTitleMobile: '식단 알림',
        exampleNotificationMessageMobile: '총 927 Kcal 무들깨국 스팸계란전 시금치나물 크림스프 김치',
        exampleNotificationCaption: '',
        acceptButtonText: '구독',
        cancelButtonText: '취소',
        showCredit: false
    },
    welcomeNotification: {
        disable: true
    },
    setDefaultNotificationUrl: '',
    setDefaultTitle: '식단 알림'
}]);


OneSignal.push(function () {
    // 브라우저 지원 여부
    var isPushSupported = OneSignal.isPushNotificationsSupported();
    if (isPushSupported) {

        // 권한 확인
        OneSignal.getNotificationPermission().then(function (permission) {

            if (permission === 'denied') {
                alert('브라우저에서 알림 권한이 거부되었습니다.\n페이지 설정에서 수동으로 해제하십시오.')
                return
            } else {

                // 구독 여부 확인
                OneSignal.isPushNotificationsEnabled().then(function (isEnabled) {
                    if (isEnabled) {

                        console.info('subscription enabled')

                        OneSignal.getTags().then(function (tags) {
                            for (var key in tags) {
                                if (key === 'breakfast' && tags[key] === 'true')
                                    $('input[name="t"][value="1"]').prop('checked', true)
                                if (key === 'launch' && tags[key] === 'true')
                                    $('input[name="t"][value="2"]').prop('checked', true)
                                if (key === 'dinner' && tags[key] === 'true')
                                    $('input[name="t"][value="3"]').prop('checked', true)
                            }
                            $('#times').show()

                            $('#modifyTags').show().click(function (e) {
                                OneSignal.sendTags(getTimes()).then(function (tagsSent) {
                                    alert('변경 완료')
                                    location.reload()
                                })
                            })
                            $('#unsubscribe').show().click(function (e) {
                                if (confirm('구독 해지 하시겠습니까?')) {
                                    OneSignal.setSubscription(false).then(function (unsubscribed) {
                                        location.reload()
                                    })
                                } else {

                                }
                            })
                        })


                    } else {
                        $('#times').show()
                        // 구독 버튼 초기화
                        $sub.show().click(function (e) {

                            var $t = $('input[name="t"]:checked')
                            if ($t.length > 0) {
                                OneSignal.registerForPushNotifications({ modalPrompt: false })
                            } else {
                                alert("조식, 중식, 석식 중 최소 한개는 선택해야 합니다.")
                                return false
                            }
                        })

                    }

                    // 구독 상태 변경 이벤트
                    OneSignal.on('subscriptionChange', function (isSubscribed) {
                        if (isSubscribed) {
                            console.info('구독 완료')
                            OneSignal.sendTags(getTimes()).then(function (tagsSent) {
                                console.info('구독 시간대 설정 완료', times, tagsSent)

                                OneSignal.sendSelfNotification(
                                    "식단 알림 보는 방법",
                                    "이 곳을 터치해서 아래로 드래그 해보세요. 화면이 작아 한번에 메시지를 볼 수 없어도 이렇게 내려서 보시면 됩니다. 물론 터치하면 당일 식단표를 확인할 수 있습니다."
                                )

                                location.reload()

                            })
                        } else {
                            console.info('구독 해지')
                        }
                    })

                })

            }

        })

    } else {
        alert("해당 브라우저는 푸시 알림을 지원하지 않습니다.")
        return
    }
});

function getTimes() {
    var $t = $('input[name="t"]:checked')
    var times = {
        breakfast: false,
        launch: false,
        dinner: false
    }

    if ($t.length > 0) {
        $t.each(function () {
            var t = $(this).val()
            if (t === '1') times.breakfast = true
            if (t === '2') times.launch = true
            if (t === '3') times.dinner = true
        })
    }

    return times
}