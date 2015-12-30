$( document ).ready(function() {
    $("#states").hide();
    
//     $.get("notifications", function(data, notifications){
        
//     })
    
    $('.task').on('click', function() {
        var taskId = $(this).val();
        $.get("tasksdetails/" + $(this).val(), function(data, status){
            
            $('#success').val("");
            $('#fail').val("");
            
            $('#save').attr('value', taskId);
            $('#success').val(data.success);
            $('#fail').val(data.fail);
            
            if($('#states').is(":visible") == false) {
                $("#states").toggle();
            }
        });                
    })
    
    $('#save').on('click', function() {
        
        $.ajax({
            url: 'tasksdetailssave', 
            type: 'POST', 
            contentType: 'application/json', 
            data: JSON.stringify( {
                taskid: $(this).attr("value"),
                success: $('#success').val(),
                fail:  $('#fail').val()
            }),
            success: function(data) {
                console.log(data)
            },
            error: function(err) {
                cnosole.log(err)
            }
        })    
    })
    
    $('#notificationcreate').on('click', function() {
        var _this = $(this);
        $.get("notificationcreate", function(data, status){
            $(_this).remove();
        })        
    });
    
    $('.notificationdelete').on('click', function() {
        var _this = $(this);
        $.get("notificationdelete" + '/' + $(this).val(), function(data, status){
            if(data.deleted > 0) {
                $(_this).parent().remove();
            }
        })
    });
    
});