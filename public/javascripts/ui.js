correctDisplay = function(){
    var sidebarHeight = $("body").height() - 66;
    $(".buffer-list").css("height", $("body").height()-20+"px");
    $(".user-list").css("height", sidebarHeight+"px");
    $(".buffer").css("height", sidebarHeight+"px");
    $(".buffer-list ul li a").each(function(){
        if($(this).text().search(/^#/) > -1){
            var id = $(this).text().replace(/^#/, "#chan_");
        } else {
            var id = $(this).text().replace(/^/, "#pm_");
        }
       $(id+" .buffer").prop("scrollTop", $(id+" .buffer").prop("scrollHeight") - $(id+" .buffer").height() + 8);
    });
}

$(window).resize(function() {
    correctDisplay();
});

$(document).ready(function() {
    correctDisplay();
});