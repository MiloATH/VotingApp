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
                $("#msg").text("Error. Can't delete this poll.").addClass("alert-danger");
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
                $("#msg").text(msg.success).addClass("alert-success").fadeIn(0, function() {
                    $(this).delay(3000).fadeOut(3000);
                });
                //TODO: Answer could be multiple words. Should use answer ids.
                var voteCounter = $("#" + answer + " #votes");
                voteCounter.text(+voteCounter.text() + 1);
                //TODO Update data in piieData and call updateChart()
            } else {
                //TODO: Better error handling ui
                $("#msg").text('Error: ' + (msg.hasOwnProperty("error") ? msg.error : "")).addClass("alert-danger").fadeIn(0, function() {
                    $(this).delay(3000).fadeOut(3000);
                });
            }
        }
    });
};

function updateChart() {
    if (window.myPie !== undefined)
        window.myPie.destroy();
    var pie_ctx = document.getElementById("pie-chart-area").getContext("2d");
    var myPie = new Chart(pie_ctx).Doughnut(pieData, {
        responsive: true,
        maintainAspectRatio: true,
        legendTemplate: '<% for (var i=0; i < pieData.length; i++) { %>' +
            '<div>' +
            '<span id="legend-color" style=\"background-color:<%=pieData[i].color%>\"></span>' +
            '<p class="legend-label"><% if (pieData [i].label) { %><%= pieData[i].label %><% } %></p>' +
            '</div>' +
            '<% } %>'
    });

    var legend = myPie.generateLegend();
    $("#legend").html(legend);
}
