/**
 * Created by Fairy_LFEn on 2016/6/7/0007.
 */
var showSubjects = function(data){
    for(var i = 0; i < data.length; i++){

    }
}

function requestSubjects(word){
    var jsonData = new Object();
    jsonData.word = word;

    $.ajax({
        url:"SubjectsProvider",
        data:jsonData,
        dataType:json,
        success: showSubjects(data)
    })
    ;
}