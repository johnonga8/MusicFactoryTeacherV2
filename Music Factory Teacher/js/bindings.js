//------GLOBAL VARIABLES-----//
var currentBookId;
var currentBookCultureName;
var currentBookType;
var currentBook;
var currentLessonNumber;
var currentChapterNumber;
var domain = "http://musicfactory.a8hosting.com/";
var dashboardURL = "views/mf-booklisting.html";
var currentUserName;
var currentAppCultureName;
var appLabels;
//var domain = "http://192.168.1.39:2580/";
//------FUNCTIONS FOR LOGIN START-----//
function AuthenticateUser(username, password) {
    var response;
    $.ajax({
        type: "POST",
        url: domain + "Custom/Services/A8_MusicFactoryService.svc/AuthenticateUser",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ username: username, password: password }),
        async: false,
        success: function (result) {
            response = result.d;
        },
        error: function () { alert("Authentication error"); }
    });
    return response;
}

function LogIn(username, password) {

    var response = AuthenticateUser(username, password)

    if (response.IsValid === true) {
        app.navigate(dashboardURL);
        currentUserName = username;
    }
    else {
        switch (response.ResponseCode) {
            case 2: //UserNotFound
            case 7: //Unknown
                $(".login-error").show();
                break;

            case 3: //UserLoggedFromDifferentIp
            case 6: //UserLoggedFromDifferentComputer
            case 9: //UserAlreadyLoggedIn
                $.fancybox.open([{ href: '#alreadylogged' }]);
                break;

            default:
                alert("Something went wrong. Please contact your system administrator.");
                break;
        }
    }
};

function BindLoginDetails()
{
    GenerateLoginDetails();
}

function GenerateLoginDetails() {
    var LoginViewModel = kendo.observable({
        SelectLanguageLabel: appLabels.First(function (label) { return label.key == "SelectLanguageLabel" }).value,
        SignInLabel: appLabels.First(function (label) { return label.key == "SignInLabel" }).value,
        ForgotPasswordLabel: appLabels.First(function (label) { return label.key == "ForgotPasswordLabel" }).value,
        UsernameLabel: appLabels.First(function (label) { return label.key == "UsernameLabel" }).value,
        PasswordLabel: appLabels.First(function (label) { return label.key == "PasswordLabel" }).value,
        InvalidLoginErrorMessage: appLabels.First(function (label) { return label.key == "InvalidLoginErrorMessage" }).value,
        LoginLabel: appLabels.First(function (label) { return label.key == "LoginLabel" }).value,
        UserLoggedInErrorMessage: appLabels.First(function (label) { return label.key == "UserLoggedInErrorMessage" }).value,
        LogOffUserLabel: appLabels.First(function (label) { return label.key == "LogOffUserLabel" }).value,
        CancelLabel: appLabels.First(function (label) { return label.key == "CancelLabel" }).value,
        SelectLanguage: function (e) {
            var langSelect = $(".choose-language select").val();
            $("#appLanguage").val(langSelect);
            currentAppCultureName = $("#appLanguage").val()
            GetTeacherAppLabels(currentAppCultureName);
            BindLoginDetails();
            if (currentAppCultureName === "zh") {
                $("body").addClass("lang-zh");
            }
            else {
                $("body").removeClass("lang-zh");
            }
        },
        Login: function (e) {
            $(".preloader-log").show();
            LogIn($("#login-username").val(), $("#login-password").val());
            $(".preloader-log").hide();
        },
        LogOffUser: function (e) {
            LogoutUser($("#login-username").val());
            LogIn($("#login-username").val(), $("#login-password").val());
        },
        Cancel: function (e) {
            $.fancybox.close([{ href: '#alreadylogged' }]);
        },
    });

    kendo.bind($("#login"), LoginViewModel);
};

//------FUNCTIONS FOR LOGIN END-----//

//------FUNCTIONS FOR BOOK LISTING START-----//
function GetAllBooks() {
    var books
    $.ajax({
        type: "POST",
        async: false,
        url: domain + "Custom/Services/A8_MusicFactoryService.svc/GetAllBooks",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        data: null,
        success: function (result) {
            books = result.d;
        },
        error: function () { alert("error GetAllBooks"); }
    });
    
    return books;
};

function BindBooklistingDetails(books) {
    GenerateBooklistingHeader();
    var TeacherProfileViewModel = GenerateTeacherProfile();
    kendo.bind($("#booklisting-teacher-profile"), TeacherProfileViewModel);
    GenerateKinderBooks(books.KinderBooks);
    GenerateInfantBooks(books.InfantBooks);
};

function GenerateBooklistingHeader() {
    var BookListingHeaderViewModel = kendo.observable({
        BookListingHeader: appLabels.First(function (label) { return label.key == "BookListingHeader" }).value
    });

    kendo.bind($("#booklisting-header"), BookListingHeaderViewModel);
};

function GenerateTeacherProfile() {
    var TeacherProfileViewModel = kendo.observable({
        
        UserWelcomeLabel: appLabels.First(function (label) { return label.key == "UserWelcomeLabel" }).value,
        BooksLabel: appLabels.First(function (label) { return label.key == "Menu_BooksLabel" }).value,
        SignOutLabel: appLabels.First(function (label) { return label.key == "SignOutLabel" }).value,
        SignOut: function(e){
          LogoutUser (currentUserName);
          app.navigate("#");
        }
    });
    
    return TeacherProfileViewModel;
};

function GenerateKinderBooks(kinderbooks) {
    var KinderBooksViewModel = kendo.observable(
    {
        KinderBooks: kinderbooks,
        SelectBook: function (e) {

            currentBookId = e.data.Id;
            currentBookCultureName = e.data.CultureName;
            currentBookType = e.data.Type;
            GetKinderBookById(currentBookId, currentBookCultureName)
            $(".preloader-mf").show();
            window.location = "#views/mf-kinderbookcover.html";
        }
    });
    kendo.bind($(".booklisting-kinder"), KinderBooksViewModel);
};

function GenerateInfantBooks(infantbooks) {
    var InfantBooksViewModel = kendo.observable(
    {
        InfantBooks: infantbooks,
        SelectBook: function (e) {

            currentBookId = e.data.Id;
            currentBookCultureName = e.data.CultureName;
            currentBookType = e.data.Type;
            GetInfantBookById(currentBookId, currentBookCultureName)
            //window.location = "#views/mf-infantbookcover.html";
            $(".preloader-mf").show();
            app.navigate("views/mf-infantbookcover.html");
        }
    });
    kendo.bind($(".booklisting-infant"), InfantBooksViewModel);
};
//------FUNCTIONS FOR BOOK LISTING END-----//

//------FUNCTIONS FOR KINDER BOOK DETAILS START-----//
function GetKinderBookById(_bookId, _cultureName) {
    $.ajax({
        type: "POST",
        url: domain + "Custom/Services/A8_MusicFactoryService.svc/GetKinderBookById",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ bookId: _bookId, cultureName: _cultureName }),
        async: false,
        success: function (result) {
            var book = result.d;
            currentBook = book;
        },
        error: function () { alert("error GetKinderBookById"); }
    });
};

function BindKinderCoverDetails(book) {
    var BookViewModel = GenerateKinderTableOfContents(book);
    kendo.bind($("#table-of-contents-cover-kinder"), BookViewModel);
    GenerateKinderCoverDetails(book);
}

function BindKinderPrefaceDetails(book) {
    var BookViewModel = GenerateKinderTableOfContents(book);
    kendo.bind($("#table-of-contents-preface-kinder"), BookViewModel);
    GenerateKinderPrefaceDetails(book);
}

function BindKinderLessonDetails(book) {
    var BookViewModel = GenerateKinderTableOfContents(book);
    kendo.bind($("#table-of-contents-chapter-kinder"), BookViewModel);
    GenerateKinderLessonDetails(book, currentChapterNumber, currentLessonNumber);
}

function BindKinderGlossaryDetails(book) {
    var BookViewModel = GenerateKinderTableOfContents(book);
    kendo.bind($("#table-of-contents-glossary-kinder"), BookViewModel);
    GenerateKinderGlossaryDetails(book);
}

function GenerateKinderTableOfContents(kinderbook) {
    var BookViewModel = kendo.observable({
        Book: kinderbook,
        Chapters: kinderbook.Chapters,
        CoverLabel: appLabels.First(function (label) { return label.key == "TableOfContents_CoverLabel" }).value,
        PrefaceTitle: kinderbook.PrefaceTitle,
        GlossaryTitle: kinderbook.GlossaryTitle,
        SlideToggle: function (e) {
            $(e.currentTarget).toggleClass('active-link');
            $(e.currentTarget).parent("li").toggleClass("li-active-link");
            $(e.currentTarget).siblings('ul').slideToggle();
            $(e.currentTarget).children(".glyphicon").toggleClass("glyphicon-triangle-bottom glyphicon-triangle-top");
        },
        SelectLesson: function (e) {
            currentLessonNumber = $(e.currentTarget).children('input.js-lessonnumber').val();
            currentChapterNumber = $(e.currentTarget).children('input.js-chapternumber').val();
            InitializeTabs();
            $('#lesson-details-kinder .km-scroll-container').hide().slideUp();
            $('#lesson-details-kinder .km-scroll-container').slideDown();
            if (window.location.href.indexOf("bookdetails") > -1) {
                hideDrawer();
                GenerateKinderLessonDetails(currentBook, currentChapterNumber, currentLessonNumber);
            }
            else {
                $(".preloader-mf").show();
                window.location = "#views/mf-kinderbookdetails.html";
            }
        },
        GoToPreface: function (e) {
            $(".preloader-mf").show();
            window.location = "#views/mf-kinderbookpreface.html";
        },
        GoToCover: function (e) {
            $(".preloader-mf").show();
            window.location = "#views/mf-kinderbookcover.html";
        },
        GoToGlossary: function (e) {
            $(".preloader-mf").show();
            window.location = "#views/mf-kinderbookglossary.html";
        },
    });
    return BookViewModel;
}

function GenerateKinderLessonDetails(book, chapterNumber, lessonNumber) {
    var currentLesson = GetLessonByNumber(book.Lessons, lessonNumber);
    var currentChapter = GetChapterByNumber(book.Chapters, currentLesson.ChapterNumber)

    var currentIndex = jQuery.inArray(currentLesson, book.Lessons)

    var prevLessonNumber = "";
    var prevLesson;
    if (currentIndex > 0) {
        //prevLesson = GetLessonByNumber(book.Lessons, (parseInt(lessonNumber) - 1));
        prevLesson = book.Lessons[currentIndex - 1];
    }
    if (prevLesson == null || prevLesson.LessonNumber == 0) {
        $(".bttn-prev-lesson").addClass("hide");
        $(".bttn-prev-preface").removeClass("hide");
    }
    else {
        prevLessonNumber = prevLesson.LessonNumber;
        $(".bttn-prev-lesson").removeClass("hide");
        $(".bttn-prev-preface").addClass("hide");
    }


    var nextLessonNumber = "";
    var nextLesson;
    if (currentIndex < (book.Lessons.length - 1)) {
        //nextLesson = GetLessonByNumber(book.Lessons, (parseInt(lessonNumber) + 1));
        nextLesson = book.Lessons[currentIndex + 1]
    }
    if (nextLesson == null) {
        $(".bttn-next-lesson").addClass("hide");
        $(".bttn-glossary-lesson").removeClass("hide");
    }
    else {
        nextLessonNumber = nextLesson.LessonNumber;
        $(".bttn-next-lesson").removeClass("hide");
        $(".bttn-glossary-lesson").addClass("hide");
    }

    var LessonViewModel = kendo.observable({
        Book: book,
        BookWelcome: book.WelcomeSong,
        BookGoodbye: book.GoodbyeSong,
        PrevLessonNumber: prevLessonNumber,
        CurrentLesson: currentLesson,
        CurrentChapter: currentChapter,
        NextLessonNumber: nextLessonNumber,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        PrefaceTitle: book.PrefaceTitle,
        BackPreface: appLabels.First(function (label) { return label.key == "KinderLesson_BackPreface" }).value,
        Back: appLabels.First(function (label) { return label.key == "KinderLesson_Back" }).value,
        GlossaryTitle: book.GlossaryTitle,
        NextGlossary: appLabels.First(function (label) { return label.key == "KinderLesson_NextGlossary" }).value,
        Next: appLabels.First(function (label) { return label.key == "KinderLesson_Next" }).value,
        Tab1: appLabels.First(function (label) { return label.key == "KinderLesson_Tab1" }).value,
        Tab2: appLabels.First(function (label) { return label.key == "KinderLesson_Tab2" }).value,
        Tab3: appLabels.First(function (label) { return label.key == "KinderLesson_Tab3" }).value,
        Tab4: appLabels.First(function (label) { return label.key == "KinderLesson_Tab4" }).value,
        Tab5: appLabels.First(function (label) { return label.key == "KinderLesson_Tab5" }).value,
        PlayWelcomeSong: appLabels.First(function (label) { return label.key == "KinderLesson_PlayWelcomeSong" }).value,
        PlayGoodbyeSong: appLabels.First(function (label) { return label.key == "KinderLesson_PlayGoodbyeSong" }).value,
        Complete: appLabels.First(function (label) { return label.key == "KinderLesson_Complete" }).value,
        CompleteButton: appLabels.First(function (label) { return label.key == "KinderLesson_CompleteButton" }).value,
        MPC_Disclaimer: appLabels.First(function (label) { return label.key == "KinderLesson_MPC_Disclaimer" }).value,
        PrevLessonClick: function (e) {
            GenerateKinderLessonDetails(currentBook, prevLesson.ChapterNumber, prevLesson.LessonNumber);
            $('#lesson-details-kinder .km-scroll-container').hide().slideUp();
            $('#lesson-details-kinder .km-scroll-container').slideDown();
            InitializeTabs();
            removeScroll();
        },
        NextLessonClick: function (e) {
            $('#lesson-details-kinder .km-scroll-container').hide().slideUp();
            $('#lesson-details-kinder .km-scroll-container').slideDown();
            InitializeTabs();
            removeScroll();
            GenerateKinderLessonDetails(currentBook, nextLesson.ChapterNumber, nextLesson.LessonNumber);
        },
        GoToLibrary: function (e) {
            $(".preloader-mf").show();
            window.location = "#views/mf-booklisting.html";
        },
    });
    kendo.bind($("#lesson-details-kinder"), LessonViewModel);
}

function GenerateKinderPrefaceDetails(book) {
    var firstLesson = book.Chapters.First().Lessons.First();
    var PrefaceViewModel = kendo.observable({
        BookTitle: book.Title,
        PrefaceContent: book.Preface,
        FirstLessonNumber: firstLesson.LessonNumber,
        Next: appLabels.First(function (label) { return label.key == "KinderPreface_Next" }).value,
        BackCover: appLabels.First(function (label) { return label.key == "KinderPreface_BackCover" }).value,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        NextLessonClick: function (e) {
            currentLessonNumber = firstLesson.LessonNumber;
            currentChapterNumber = firstLesson.ChapterNumber;
            window.location = "#views/mf-kinderbookdetails.html";
        },
        GoToLibrary: function (e) {
            $(".preloader-mf").show();
            window.location = "#views/mf-booklisting.html";
        },
    });
    kendo.bind($("#preface-details-kinder"), PrefaceViewModel, kendo.ui, kendo.mobile.ui);
}

function GenerateKinderGlossaryDetails(book) {
    var lastLesson = book.Chapters.Last().Lessons.Last();
    var GlossaryViewModel = kendo.observable({
        BookTitle: book.Title,
        GlossaryContent: book.Glossary,
        LastLessonNumber: lastLesson.LessonNumber,
        Back: appLabels.First(function (label) { return label.key == "KinderGlossary_Back" }).value,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        GoToLibrary: function (e) {
            window.location = "#views/mf-booklisting.html";
        },
        PrevLessonClick: function (e) {
            currentLessonNumber = lastLesson.LessonNumber;
            currentChapterNumber = lastLesson.ChapterNumber;
            $(".preloader-mf").show();
            window.location = "#views/mf-kinderbookdetails.html";
        },
    });
    kendo.bind($("#glossary-details-kinder"), GlossaryViewModel);
}

function GenerateKinderCoverDetails(book) {
    var bookdetailsfullheightcover = $(window).height();
    var CoverViewModel = kendo.observable({
        BookTitle: book.Title,
        CoverImageUrl: book.CoverImageUrl,
        PrefaceTitle: book.PrefaceTitle,
        Next: appLabels.First(function (label) { return label.key == "KinderCover_Next" }).value,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        GoToLibrary: function (e) {
            $(".preloader-mf").show();
            window.location = "#views/mf-booklisting.html";
        },
    });
    kendo.bind($("#cover-details-kinder"), CoverViewModel);
}
//------FUNCTIONS FOR KINDER BOOK DETAILS END-----//

//------FUNCTIONS FOR INFANT BOOK DETAILS START-----// 
function GetInfantBookById(_bookId, _cultureName) {
    $.ajax({
        type: "POST",
        url: domain + "Custom/Services/A8_MusicFactoryService.svc/GetInfantBookById",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ bookId: _bookId, cultureName: _cultureName }),
        async: false,
        success: function (result) {
            var book = result.d;
            currentBook = book;
        },
        error: function () { alert("error GetInfantById"); }
    });
};

function BindInfantCoverDetails(book) {
    var BookViewModel = GenerateInfantTableOfContents(book);
    kendo.bind($("#table-of-contents-cover-infant"), BookViewModel);
    GenerateInfantCoverDetails(book);
}

function BindInfantPrefaceDetails(book) {
    var BookViewModel = GenerateInfantTableOfContents(book);
    kendo.bind($("#table-of-contents-preface-infant"), BookViewModel);
    GenerateInfantPrefaceDetails(book);
}

function BindInfantLessonDetails(book) {
    var BookViewModel = GenerateInfantTableOfContents(book);
    kendo.bind($("#table-of-contents-theme-infant"), BookViewModel);
    GenerateInfantLessonDetails(book, currentChapterNumber, currentLessonNumber);
}

function BindInfantGlossaryDetails(book) {
    var BookViewModel = GenerateInfantTableOfContents(book);
    kendo.bind($("#table-of-contents-glossary-infant"), BookViewModel);
    GenerateInfantGlossaryDetails(book);
}

function GenerateInfantTableOfContents(infantbook) {
    var BookViewModel = kendo.observable({
        Book: infantbook,
        Themes: infantbook.Themes,
        CoverLabel: appLabels.First(function (label) { return label.key == "TableOfContents_CoverLabel" }).value,
        PrefaceTitle: infantbook.PrefaceTitle,
        GlossaryTitle: infantbook.GlossaryTitle,
        SlideToggle: function (e) {
            $(e.currentTarget).toggleClass('active-link');
            $(e.currentTarget).parent("li").toggleClass("li-active-link");
            $(e.currentTarget).siblings('ul').slideToggle();
            $(e.currentTarget).children(".glyphicon").toggleClass("glyphicon-triangle-bottom glyphicon-triangle-top");
        },
        SelectLesson: function (e) {
            currentLessonNumber = $(e.currentTarget).children('input.js-lessonnumber').val();
            currentChapterNumber = $(e.currentTarget).children('input.js-chapternumber').val();
            InitializeTabs();
            $('#lesson-details-infant .km-scroll-container').hide().slideUp();
            $('#lesson-details-infant .km-scroll-container').slideDown();
            if (window.location.href.indexOf("bookdetails") > -1) {
                hideDrawer();
                GenerateInfantLessonDetails(currentBook, currentChapterNumber, currentLessonNumber);
            }
            else {
                //window.location = "#views/mf-infantbookdetails.html";
                $(".preloader-mf").show();
                app.navigate("views/mf-infantbookdetails.html");
            }
        },
        GoToPreface: function (e) {
            // window.location = "#views/mf-infantbookpreface.html";
            $(".preloader-mf").show();
            app.navigate("views/mf-infantbookpreface.html");
        },
        GoToCover: function (e) {
            //window.location = "#views/mf-infantbookcover.html";
            $(".preloader-mf").show();
            app.navigate("views/mf-infantbookcover.html");
        },
        GoToGlossary: function (e) {
            // window.location = "#views/mf-infantbookglossary.html";
            $(".preloader-mf").show();
            app.navigate("views/mf-infantbookglossary.html");
        },
    });
    return BookViewModel;
}

function GenerateInfantCoverDetails(book) {
    var bookdetailsfullheightcover = $(window).height();
    var CoverViewModel = kendo.observable({
        BookTitle: book.Title,
        CoverImageUrl: book.CoverImageUrl,
        PrefaceTitle: book.PrefaceTitle,
		Next: appLabels.First(function (label) { return label.key == "InfantCover_Next" }).value,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        GoToLibrary: function (e) {
            // window.location = "#views/mf-booklisting.html";
            $(".preloader-mf").show();
            app.navigate(dashboardURL);
        },
    });
    kendo.bind($("#cover-details-infant"), CoverViewModel);
}

function GenerateInfantPrefaceDetails(book) {
    var firstLesson = book.Themes.First().Lessons.First();
    var PrefaceViewModel = kendo.observable({
        BookTitle: book.Title,
        PrefaceContent: book.Preface,
        FirstLessonNumber: firstLesson.LessonNumber,
		Next: appLabels.First(function (label) { return label.key == "InfantPreface_Next" }).value,
        BackCover: appLabels.First(function (label) { return label.key == "InfantPreface_BackCover" }).value,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        NextLessonClick: function (e) {
            currentLessonNumber = firstLesson.LessonNumber;
            currentChapterNumber = firstLesson.ThemeNumber;
            //window.location = "#views/mf-infantbookdetails.html";
            $(".preloader-mf").show();
            app.navigate("views/mf-infantbookdetails.html");
        },
        GoToLibrary: function (e) {
            // window.location = "#views/mf-booklisting.html";
            $(".preloader-mf").show();
            app.navigate(dashboardURL);
        },
    });
    kendo.bind($("#preface-details-infant"), PrefaceViewModel, kendo.ui, kendo.mobile.ui);
}

function GenerateInfantLessonDetails(book, chapterNumber, lessonNumber) {
    var currentLesson = GetLessonByNumber(book.Lessons, lessonNumber);
    var currentChapter = GetChapterByNumber(book.Themes, currentLesson.ThemeNumber)

    var currentIndex = jQuery.inArray(currentLesson, book.Lessons)

    var prevLessonNumber = "";
    var prevLesson;
    if (currentIndex > 0) {
        //prevLesson = GetLessonByNumber(book.Lessons, (parseInt(lessonNumber) - 1));
        prevLesson = book.Lessons[currentIndex - 1];
    }
    if (prevLesson == null || prevLesson.LessonNumber == 0) {
        $(".bttn-prev-lesson").addClass("hide");
        $(".bttn-prev-preface").removeClass("hide");
    }
    else {
        prevLessonNumber = prevLesson.LessonNumber;
        $(".bttn-prev-lesson").removeClass("hide");
        $(".bttn-prev-preface").addClass("hide");
    }


    var nextLessonNumber = "";
    var nextLesson;
    if (currentIndex < (book.Lessons.length - 1)) {
        //nextLesson = GetLessonByNumber(book.Lessons, (parseInt(lessonNumber) + 1));
        nextLesson = book.Lessons[currentIndex + 1]
    }
    if (nextLesson == null) {
        $(".bttn-next-lesson").addClass("hide");
        $(".bttn-glossary-lesson").removeClass("hide");
    }
    else {
        nextLessonNumber = nextLesson.LessonNumber;
        $(".bttn-next-lesson").removeClass("hide");
        $(".bttn-glossary-lesson").addClass("hide");
    }

    var LessonViewModel = kendo.observable({
        Book: book,
        BookWelcome: book.WelcomeSong,
        BookGoodbye: book.GoodbyeSong,
        PrevLessonNumber: prevLessonNumber,
        CurrentLesson: currentLesson,
        CurrentTheme: currentChapter,
        NextLessonNumber: nextLessonNumber,
		GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        PrefaceTitle: book.PrefaceTitle,
        BackPreface: appLabels.First(function (label) { return label.key == "InfantLesson_BackPreface" }).value,
        Back: appLabels.First(function (label) { return label.key == "InfantLesson_Back" }).value,
        GlossaryTitle: book.GlossaryTitle,
        NextGlossary: appLabels.First(function (label) { return label.key == "InfantLesson_NextGlossary" }).value,
        Next: appLabels.First(function (label) { return label.key == "InfantLesson_Next" }).value,
        Tab1: appLabels.First(function (label) { return label.key == "InfantLesson_Tab1" }).value,
        Tab2: appLabels.First(function (label) { return label.key == "InfantLesson_Tab2" }).value,
        Tab3: appLabels.First(function (label) { return label.key == "InfantLesson_Tab3" }).value,
        Tab4: appLabels.First(function (label) { return label.key == "InfantLesson_Tab4" }).value,
        PlayWelcomeSong: appLabels.First(function (label) { return label.key == "InfantLesson_PlayWelcomeSong" }).value,
        PlayGoodbyeSong: appLabels.First(function (label) { return label.key == "InfantLesson_PlayGoodbyeSong" }).value,
        Complete: appLabels.First(function (label) { return label.key == "InfantLesson_Complete" }).value,
        CompleteButton: appLabels.First(function (label) { return label.key == "InfantLesson_CompleteButton" }).value,
        MPC_Disclaimer: appLabels.First(function (label) { return label.key == "InfantLesson_MPC_Disclaimer" }).value,
        PrevLessonClick: function (e) {
            GenerateInfantLessonDetails(currentBook, prevLesson.ThemeNumber, prevLesson.LessonNumber);
            $('#lesson-details-infant .km-scroll-container').hide().slideUp();
            $('#lesson-details-infant .km-scroll-container').slideDown();
            InitializeTabs();
            removeScroll();
        },
        NextLessonClick: function (e) {
            $('#lesson-details-infant .km-scroll-container').hide().slideUp();
            $('#lesson-details-infant .km-scroll-container').slideDown();
            InitializeTabs();
            removeScroll();
            GenerateInfantLessonDetails(currentBook, nextLesson.ThemeNumber, nextLesson.LessonNumber);
        },
        GoToLibrary: function (e) {
            //window.location = "#views/mf-booklisting.html";
            $(".preloader-mf").show();
            app.navigate(dashboardURL);
        },
    });
    kendo.bind($("#lesson-details-infant"), LessonViewModel);
}

function GenerateInfantGlossaryDetails(book) {
    var lastLesson = book.Themes.Last().Lessons.Last();
    var GlossaryViewModel = kendo.observable({
        BookTitle: book.Title,
        GlossaryContent: book.Glossary,
        LastLessonNumber: lastLesson.LessonNumber,
		Back: appLabels.First(function (label) { return label.key == "InfantGlossary_Back" }).value,
        GoToHomeLabel: appLabels.First(function (label) { return label.key == "GoToHomeLabel" }).value,
        TableOfContentsLabel: appLabels.First(function (label) { return label.key == "TableOfContentsLabel" }).value,
        GoToLibrary: function (e) {
            // window.location = "#views/mf-booklisting.html";
            app.navigate(dashboardURL);
        },
        PrevLessonClick: function (e) {
            currentLessonNumber = lastLesson.LessonNumber;
            currentChapterNumber = lastLesson.ThemeNumber;
            //  window.location = "#views/mf-infantbookdetails.html";
            $(".preloader-mf").show();
            app.navigate("views/mf-infantbookdetails.html");
        },
    });
    kendo.bind($("#glossary-details-infant"), GlossaryViewModel);
}

//------FUNCTIONS FOR INFANT BOOK DETAILS END-----//    

//------COMMON FUNCTIONS START-----//
function GetChapterByNumber(chapters, chapterNumber) {
    var chapter = chapters.First(function (chapter) { return chapter.ChapterNumber == chapterNumber });
    return chapter;
}

function GetLessonByNumber(lessons, lessonNumber) {
    var lesson = lessons.First(function (lesson) { return lesson.LessonNumber == lessonNumber });
    return lesson;
}

function RenderLessonsTemplate(chapter) {
    return kendo.Template.compile($('#lessons-template').html())(chapter);
}

function EnableScrolling() {
    $("#scroller").data("kendoMobileScroller").enable();
}

function LogoutUser(username) {
    var isSuccessful;
    $.ajax({
        type: "POST",
        url: domain + "Custom/Services/A8_MusicFactoryService.svc/LogoutUser",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ username: username }),
        async: false,
        beforeSend: function () {
            $(".preloader-img").show();
        },
        complete: function () {
            $.fancybox.close([{ href: '#alreadylogged' }]);
            $(".preloader-img").hide();
        },
        success: function (result) {
            isSuccessful = result.d;
            if (isSuccessful === true) {
                currentUserName = "";
            }
        },
        error: function () { alert("Logout error"); }
    });
    return isSuccessful;
}

function GetTeacherAppLabels(cultureName) {
    $.ajax({
        type: "POST",
        url: domain + "Custom/Services/A8_MusicFactoryService.svc/GetTeacherAppLabels",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ cultureName: cultureName }),
        async: false,
        success: function (result) {
            appLabels = result.d;
        },
        error: function (error) { alert(error); }
    });
}
//------COMMON FUNCTIONS END-----//

/*$(".choose-language select").change(function () {
    var langSelect = $(".choose-language select").val();
    $("#appLanguage").val(langSelect);
    currentAppCultureName = $("#appLanguage").val()
    GetTeacherAppLabels(currentAppCultureName);
    if (currentAppCultureName === "zh") {
        $("body").addClass("lang-zh");
    }
    else {
        $("body").removeClass("lang-zh");
    }
});*/