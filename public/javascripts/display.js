var heightStuff = function(){
    var sidebarHeight = $("body").height() - $(".input").outerHeight(true);
    $(".buffer-list").css("height", sidebarHeight+"px");
    $(".user-list").css("height", sidebarHeight+"px");
    $(".buffer").css("height", sidebarHeight - $(".topic").outerHeight(true));
}

var dynamicStuff = function(){
    heightStuff();
}

$(document).ready(function() {
    heightStuff();
});