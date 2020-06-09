function tabSwitching(event, tab){
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for(i=0; i< tabcontent.length; i++){
        tabcontent[i].style.display = "none";
    }
    document.getElementById(tab).style.display = "block";
}
