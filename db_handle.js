var Datastore = require('nedb');
var db = new Datastore({ filename: 'data/ads.db', autoload: true });
db.find({}, function(err, ads) {
 if (err) throw err; 
 console.log(ads);
 
 for(var x = 0; x < ads.length; x++){
    $('#ads').append('<li id="' + ads[x].title.split(' ').join('_') + '">' + ads[x].title + ' <button class="text-danger" id="delete" onclick="deleteAd(' + ads[x].title.split(' ').join('_') + ')">x</button></li>');
 }
});

 function saveData(){
     var category = $('#category').val()
     var title = $('#title').val()
     var desc = $('#description').val()
     var found = false;
     db.find({title: title}, function(err, ad) {
      if(ad) found = true;
     })
     var location = $('#location').val()
     var city = $('#city').val().split('_').join(' ')
     var email = $('#email').val()
     var phone = $('#phone').val()
     var age = $('#age').val()
     if(!found && category !== '' && title != '' && desc != '' && phone != '' && email != '' && location != '' && city != ''){
         var ad = {category, title, desc, location, city, email, phone, age};
 
         db.insert(ad, function (err, newAd) {   // Callback is optional 
           if (err) throw err;
           console.log('Added new ad: ' + newAd.title);
           $('#ads').append('<li id="' + newAd.title.split(' ').join('_') + '">' + newAd.title + ' <button class="text-danger" id="delete" onclick="deleteAd(' + newAd.title.split(' ').join('_') + ')">x</button></li>');
         });
         
         $('#title').val('')
         $('#description').val('')
         $('#location').val('')
         $('#email').val('')
         $('#phone').val('')
         $('#age').val('')
     }

 }
 function deleteAd(title){
  console.log(title);
    db.remove({title: title}, function(err) {
     if (err) throw err;
     console.log('Deleted ' + title.split('_').join(' '));
     $('#' + title).remove();
    });
 }