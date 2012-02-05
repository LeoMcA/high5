var heightStuff = function(){
    var sidebarHeight = $("body").height() - $(".input").outerHeight(true);
    $(".buffer-list").css("height", sidebarHeight+"px");
    $(".user-list").css("height", sidebarHeight+"px");
    $(".tab-content").each(function(index){
       $(".buffer").eq(index).css("height", sidebarHeight - $(".topic").eq(index).outerHeight(true));
    });
}

dynamicStuff = function(){
    heightStuff();
}

$(document).ready(function() {
    heightStuff();
});