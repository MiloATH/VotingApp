function removePoll(id) {
    var data = "pollId=" + id;
    $.ajax({
        type: "DELETE",
        url: "/api/delete",
        data: data,
        success: function(msg) {
            if (msg.hasOwnProperty("success")) {
                $("#" + id).remove();
            } else {
                //TODO: Better error handling ui
                $("#msg").text('Error. Can\'t delete this poll.').addClass("alert-danger");
            }
        }
    });
};

function vote(answer) {
    var poll = $('.title').attr("id");
    var data = {
        answer: answer,
        poll: poll
    };
    $.ajax({
        type: "POST",
        url: "/api/vote",
        data: data,
        success: function(msg) {
            if (msg.hasOwnProperty("success")) {
                $("#msg").text(msg.success).addClass("alert-success");
                var voteCounter = $("#" + answer + " #votes");
                voteCounter.text(+voteCounter.text() + 1);

            } else {
                //TODO: Better error handling ui
                $("#msg").text('Error: ' + (msg.hasOwnProperty("error") ? msg.error : "") +
                    ' Vote may not have been counted.').addClass("alert-danger");
            }
        }
    });
};
