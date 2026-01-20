function checkScrollPosition() {
    var myElemHeight = $('#myElement').height(); // Get height/size of 'myElement' div. Change this to your actual element size
or id
                                               if you are using other method (like window scrollY, etc.) replace with
appropriate methods
                                                                      in order it will work fine for most cases
     var containerHeight = $('#scrollContainer').height(); // Get height/size of 'myElement' div. Change this to your actual
element size or id
                                                          if you are using other method (like window scrollY, etc.) replace
with appropriate methods
                                                                      in order it will work fine for most cases
     var gap = myElemHeight + containerHeight; // Get the total height of both elements. If one grows then so should the others
due to our 1px offsets on all sides (if they don't need that much scrolling)
                                                                      Change this calculation as per your specific requirements

     if(window.innerHeight > gap){             // Only scroll when we reach top of container, not yet at bottom
        $('#scrollContainer').trigger("scroll");  // Scroll to end and then wait again after that
        setTimeout('checkScrollPosition()',20);   /// Call the function itself every half second until it reaches minimum gap
 1- (gap/speed) seconds, adjust as per your need
    }else{
        $('#myElement').trigger("scroll");       // Once all of our content has been reached at least once then just scroll to
bottom by triggering 'scrolling' event again.  This will reset the timer and should not cause any issues if you have called
this script before after it is done scrolling
     }                                           /// You can adjust delay or speed as per your requirement        /////
                                                           If user stops waiting, then function call itself until page reach
top of container due to setTimeout.          It will stop when the element reached bottom and start again on reaching end which
might be different case for you scenario based upon need
}