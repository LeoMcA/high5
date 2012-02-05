correctDisplay = function(){
    var sidebarHeight = $("body").height() - 66;
    $(".buffer-list").css("height", $("body").height()+"px");
    $(".user-list").css("height", sidebarHeight+"px");
    $(".buffer-list ul li").each(function(index){
       $(".buffer").eq(index).css("height", sidebarHeight - $(".topic").eq(index).outerHeight(true));
       $(".buffer").eq(index).prop("scrollTop", $(".buffer").eq(index).prop("scrollHeight") - $('.buffer').eq(index).height() + 8);
    });
}

$(window).resize(function() {
    correctDisplay();
});

$(document).ready(function() {
    correctDisplay();
});