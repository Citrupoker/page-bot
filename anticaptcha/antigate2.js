// http module should be installed:
// npm i http

// Params:
// your anti-captcha.com account key
require('dotenv').config();

var anticaptcha = require('./anticaptcha')(process.env.ANTIGATE_KEY);

//recaptcha key from target website
anticaptcha.setWebsiteURL("http://posting.limaoh.backpage.com/online/classifieds/PostAdPPI.html/lma/limaoh.backpage.com/");
anticaptcha.setWebsiteKey("6LfZsQMTAAAAAMNekgRgcuRVRMiPYCh8plUMHh-m");

//browser header parameters
anticaptcha.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116");

// check balance first
anticaptcha.getBalance(function (err, balance) {
    if (err) {
        console.error(err);
        return;
    }

    if (balance > 0) {
        anticaptcha.createTaskProxyless(function (err, taskId) {
            if (err) {
                console.error(err);
                return;
            }

            console.log(taskId);

            anticaptcha.getTaskSolution(taskId, function (err, taskSolution) {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log('this is solution: ' + taskSolution);
            });
        });
    }
});