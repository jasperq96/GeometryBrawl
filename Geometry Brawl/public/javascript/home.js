function tabSwitching(event, tab, background, color){
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for(i=0; i< tabcontent.length; i++){
        tabcontent[i].style.display = "none";
    }
    document.getElementById(tab).style.display = "block";
    document.getElementById(background).style.borderColor = color;
}


function colorPicker(color, circleID){
    document.getElementById(circleID).style.backgroundColor = color;
}

// function scrollBar(id){
// 	var scroll = document.getElementById(id);
// 	scroll.scrollTop = scroll.scrollHeight;
// 	console.log('got here');
// }