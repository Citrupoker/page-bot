var anticaptcha = require('./anticaptcha/config.js');
console.log(anticaptcha);

var categoryOptions = Object.keys(postings).sort().reduce((str, key) => {
  return str + '<option value=' + key + '>' + postings[key].original + '</option>';
}, '');
var cityOptions = cities.sort().reduce((str, key) => {
  return str + '<option value=' + key.split(' ').join('_') + '>' + key + '</option>';
}, '');

$('#category').append(categoryOptions);
$('#city').append(cityOptions);

function startScrape(){
    console.log('Logging in to backpage...')
    var Nightmare = require('nightmare');
    var nightmare = Nightmare({ show: true });
    
    $('.notification').html('Your ads are being posted. Please wait!');
    $('.scrapeBtn').prop('disabled', true);

    nightmare.goto('https://my.backpage.com/classifieds/central/index')
          // Log in to Backpage
          .insert('#centralEmail', $('#bp_email').val())
          .insert('#centralPassword', $('#password').val())
          .wait(100)
          .uncheck('#centralRemember')
          .click('.signIn')
          .then(function() {
            
            function addAd(index, ads) {
              var ad = ads[index];
              console.log(ad);
              var city = ad.city.split(' ').join('');
              
              var localUrl = 'http://posting.' + city + '.backpage.com/online/classifieds/PostAdPPI.html/posting.' + 
              city +'.backpage.com/?section=' + postings[ad.category].section + '&category=' + 
              postings[ad.category].category + '&serverName=' + city + '.backpage.com&superRegion=' + ad.city.split(' ').join('%20');
              
              console.log(localUrl);
              
              // Go to the url for every job post
              return nightmare.goto(localUrl)
                // If there is no title input, the page is asking for age confirmation, so click Continue
                .exists('input[name="title"]')
                .then(function(titleInput) {
                  if (!titleInput) {
                    return nightmare.click('input[value="Continue"]');
                  }
                })
                .then(function() {
                  // Fill in input areas with info from client
                  return nightmare.wait('input[name="title"]')
                    .insert('input[name="title"]', ad.title)
                    .insert('textarea[name="ad"]', ad.desc)
                    .insert('input[name="regionOther"]', ad.location)
                    .insert('input[name="email"]', ad.email)
                    .insert('input[name="emailConfirm"]', ad.email)
                    // If there is an age input element, fill it with the age that the user has provided
                    // or otherwise 20 (random value) in case the user has forgotten to input their own
                    // that is for age verification purposes
                    .exists('input[name="age"]')
                    .then(function(ageInput) {
                      if (ageInput) {
                        return nightmare.insert('input[name="age"]', ad.age || 20);
                      }
                    })
                    .then(function() {
                      // Some pages require phone instead of email as contact information
                      return nightmare.exists('input[name="contactPhone"]')
                        .then(function(phoneInput) {
                            if (phoneInput) {
                              return nightmare.insert('input[name="contactPhone"]', ad.phone);
                            }
                        })
                        .then(function() {
                          return nightmare.on('console', (log, msg) => {
                                console.log(msg)
                            }).click('input[name="acceptTerms"]')
                            .click('#submit_button')
                            // Wait for recaptcha page
                            .wait('#g-recaptcha-response')
                            .evaluate(() => {
                              // Take the url and recaptcha key from the page
                              var url = document.URL;
                              var key = document.querySelector('.g-recaptcha').getAttribute('data-sitekey');
                              return {url, key};
                             })
                            .then(function(obj){
                                // Call the anticaptchaFunc function (takes 30 secs to respond) to get the solution 
                                // Insert it in g-captcha-response textarea, and finally submit
                                return anticaptchaFunc(obj.url, obj.key, function(solution) {
                                  console.log('captcha solution: ' + solution);
                                  return nightmare.inject('css', './textarea.css')
                                    .insert('#g-recaptcha-response', solution)
                                    .click('#submit_button')
                                    .wait(3000)
                                    .then(function() {
                                      if ((index + 1) < ads.length) {
                                        return addAd((index + 1), ads);
                                      } else {
                                        console.log('All done');
                                        $('.scrapeBtn').prop('disabled', false);
                                        $('.notification').html('Your ads have been posted successfully.');
                                        ads.forEach((ad) => deleteAd(ad.title));
                                        return nightmare.end();
                                      }
                                    });
                                });
                            })
                        })
                    })
                })
            }
            
            db.find({}, function(err, ads) {
             if (err) throw err; 
             return addAd(0, ads);
            });
          });  
}

function anticaptchaFunc(url, key, callback) {
  anticaptcha.setWebsiteURL(url);
  anticaptcha.setWebsiteKey(key);
  anticaptcha.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116");
  
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
  
                  callback(taskSolution);
              });
          });
      }
  });
}