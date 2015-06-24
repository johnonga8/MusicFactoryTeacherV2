(function () {
    var fullheight = $(window).height();
    $('.js-fullheight-side').css('min-height', fullheight);
    $('.listing-books').css('height', fullheight - 90);
    
    $(".tabs-listing .tab-kinder").click(function(){
      $(".tabcontent-kindergarten").show();
      $(".tabcontent-infantbooks").hide();
    });
    $(".tabs-listing .tab-inf").click(function(){
      $(".tabcontent-kindergarten").hide();
      $(".tabcontent-infantbooks").show();
    });
}());

