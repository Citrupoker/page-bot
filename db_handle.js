 const flat = require('node-flat-db');
 const storage = require('node-flat-db/file-async');

 const db = flat('data/backpage.json', { storage });

 const ads = db('ads').map('title');

 for(var x= 0; x< db('ads').size(); x++){
     $('#ads').append(`<li id="${ads[x].split(' ').join('_')}">` + ads[x] + ` <button class="text-danger" id="delete" onclick="deleteAd(${ads[x].split(' ').join('_')})">x</button></li>`)
 }

 function saveData(){
     var category = $('#category').val()
     var title = $('#title').val()
     var desc = $('#description').val()
     var found = db('ads').find({title: title})
     var location = $('#location').val()
     var city = $('#city').val().split('_').join(' ')
     var email = $('#email').val()
     var phone = $('#phone').val()
     var age = $('#age').val()
     if(!found && category !== '' && title != '' && desc != '' && phone != '' && email != '' && location != '' && city != ''){
         db('ads').push({
             category: category,
             title: title,
             description: desc,
             email: email,
             phone: phone,
             location: location,
             city: city,
             age: age
         })
             .then(ad => $('#ads').append(`<li id="${title.split(' ').join('_')}">` + title + ` <button class="text-danger" id="delete" onclick="deleteAd(${title.split(' ').join('_')})">x</button></li>`))
         
         $('#category').val()
         $('#title').val('')
         $('#description').val('')
         $('#city').val('')
         $('#location').val('')
         $('#email').val('')
         $('#phone').val('')
         $('#age').val('')
     }

 }
 function deleteAd(title){
     var id = title.id.split('_').join(' ');
     console.log('deleted', id);
     db('ads').remove({ title: id })
     $('#' + title.id).remove();
 }