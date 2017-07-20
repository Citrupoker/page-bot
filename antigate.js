var Antigate = require('antigate');
require('dotenv').config();

var ag = new Antigate(process.env.ANTIGATE_KEY);

// Recognize the captcha by URL 
ag.processFromURL('https://www.google.com/recaptcha/api2/anchor?k=6LfZsQMTAAAAAMNekgRgcuRVRMiPYCh8plUMHh-m&co=aHR0cDovL3Bvc3RpbmcubGltYW9oLmJhY2twYWdlLmNvbTo4MA..&hl=en&v=r20170712134223&size=normal&cb=5y667m9gkfa2', function(error, text, id) {
  if (error) {
    console.log('err');
    throw error;
  } else {
    console.log("Success");
  }
});