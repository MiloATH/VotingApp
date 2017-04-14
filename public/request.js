function removePoll(id) {
    var data = "pollId=" + id;
    console.log(data);
    $.ajax({
        type: "DELETE",
        url: "/api/delete",
        data: data,
        success: function(msg) {
            if (msg.hasOwnProperty("success")) {
                $("#" + id).remove();
            } else {
                //TODO: Better error handling ui
                $("#" + id).append('<div class="alert alert-danger" role="alert">Error. Can\'t delete this poll. </div>');
            }
        }
    });
};
