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

    nightmare.goto('https://my.backpage.com/classifieds/central/index')
          // Log in to Backpage
          .insert('#centralEmail', $('#bp_email').val())
          .insert('#centralPassword', $('#password').val())
          .wait(100)
          .uncheck('#centralRemember')
          .click('.signIn')
          .then(function() {
            var ads = db('ads');
            console.log(ads);
            
            ads.reduce(function(accumulator, ad) {
              // Loop through every ad in the database
              var city = ad.city.split(' ').join('');
              
              return accumulator.then(function(result) {
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
                      .insert('textarea[name="ad"]', ad.description)
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
                              .wait('.g-recaptcha')
                              .evaluate(() => {
                                var url = document.URL;
                                var key = document.querySelector('.g-recaptcha').getAttribute('data-sitekey');
                                return {url, key};
                               })
                              .then(function(obj){
                                  return anticaptchaFunc(obj.url, obj.key, function(solution) {
                                    console.log("The solution: " + solution);
                                    return nightmare.goto(solution);
                                  });
                              })
                          })
                      })
                  })
              });
            }, Promise.resolve('')).then(function(result){
                console.log("Done posting all ads");
            });
          });
    
}

function anticaptchaFunc(url, key, callback) {
  var solution = '';
  
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
  
                  console.log('this is solution: ' + taskSolution);
                  callback(taskSolution);
              });
          });
      }
  });
}