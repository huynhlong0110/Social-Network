$(document).ready(function() {
    var limit = 10;
    var limit_cm = 5;
    var start = 0;
    var time = new Date();
    var action = 'inactive';
    var action_cm = 'inactive'
    var urlParams = new URLSearchParams(window.location.search);

    //load and scroll=======================================

    if (urlParams.get('id')) {
        if (action == 'inactive') {
            action = 'active';
            load_post_data_personal(limit, start, time, urlParams.get('id'))
        }
    } else {
        if (action == 'inactive') {
            action = 'active';
            load_post_data(limit, start, time);
        }
    }

    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() > $("#load_data").height() && action == 'inactive') {
            action = 'active';
            start = start + limit;
            setTimeout(function() {
                if (urlParams.get('id')) {
                    load_post_data_personal(limit, start, time, urlParams.get('id'))
                } else {
                    load_post_data(limit, start, time);
                }
            }, 1000);
        }
    })

    // load post data personal=============================================    
    function load_post_data_personal(limit, start, time, id) {
        $.ajax({
            type: 'GET',
            url: '/load_data_personal',
            data: { limit: limit, start: start, time: time, id: id },
            cache: false,
            success: function(pt) {
                load_post(pt)
            }
        });
    }

    //load post data=============================================    
    function load_post_data(limit, start, time) {
        $.ajax({
            type: 'GET',
            url: '/load_data',
            data: { limit: limit, start: start, time: time },
            cache: false,
            success: function(pt) {
                load_post(pt)
            }
        });
    }

    //function load post
    function load_post(pt) {
        var html = '';
        var i = 0;
        pt.posts.forEach(function(data) {
            html += `<div class="card" id="post-content${data._id}">
                        <div class="card__body">
                            <a href="/personal?id=${data.iduser._id}">
                                <img  class="mr-2" src="${data.iduser.pic}" width="40" height="40">
                                <span class="card__username">${data.iduser.name}</span>
                            </a> °
                            <span class="card__time-up">${new Date(data.created).toLocaleString('en-JM')}</span>
                            ${checkuser_post(data.iduser._id, pt.user._id, data._id)}
                            <br>
                            <div>
                                <p class="card__content-up">${data.content}</p>
                                ${check_image(data)}
                                ${check_video(data)}
                                <span tabindex="-1" class="d-inline-block" 
                                                    data-trigger="focus" 
                                                    data-toggle="popover" 
                                                    data-content="<div class='user-like'>
                                                        ${user_liked(pt.ulike[i].favorites)}
                                                    </div>
                                ">
                                    
                                    <span class="card__favorite"> <i class="fa fa-heart"></i> <span class="countfavorite${data._id}">${data.favorites.length}</span> Lượt thích</span>
                                </span>   

                                <a href="#comment" class="${data._id}"><span class="card__comments">${pt.countComment[i]} Bình luận</span></a>
                            </div><hr>
                            <div class="card__bottom-up">
                                <a href="#favorite" class="favorite${data._id}"><span class="fa-heart${data._id}">${check_favorite(data, pt.user)}</span> Thích</a>&emsp;
                                <a href="#comment" class="${data._id}"><i class="fa fa-comments"></i> Bình luận</a>&emsp;
                                
                            </div>
                            <div id="${data._id}">
                            </div>
                        </div>
                    </div>`;
            // Favorite================

            favorite(data, pt.user)
            //Input comment ===================================
            input_comment(data, pt.user)
                //Readmore comments======================================================
            var begin = 0
            $(document).on('click', '#readmore' + data._id, function() {
                action_cm = 'active';
                begin = begin + limit_cm
                load_comment(limit_cm, begin, data._id, time)
            });
            //Delete post==========================================
            delete_post(data._id)
            i++;
        })
        $('#load_data').append(html);
        $('[data-toggle="popover"]').popover({ html: true, delay: { hide: 150 } });
        if (pt.posts == '') {
            $('#load_data_message').html("");
            action = 'active';
        } else {
            $('#load_data_message').html("<div class='spinner-border text-warning' ></div>");
            action = 'inactive';
        }
    }

    //Function user liked ======================================
    function user_liked(data) {
        var text = ''
        data.forEach(element => {
            text += `<a href='/personal?id=${element._id}'>
                        <img  class='mr-2' src='${element.pic}' width='30' height='30'>
                        <span>${element.name}</span>
                    </a><br>`
        })
        return text   
    }
    //check favorite======================================
    function check_favorite(data, user) {
        var status = ''
        if(data.favorites.includes(user._id)){
            status += `<i class="fa fa-heart fa-heart${data._id}"></i>`
        }else {
            status += `<i class="far fa-heart fa-heart${data._id}"></i>`
        }
        return status
    }

    //function favorite=====================================
    function favorite(data, user) { 
        $(document).on('click', '.favorite' + data._id, function() {
            $.ajax({
                url: "/favorite",
                method: "GET",
                data: {data: data._id, user: user._id},
                success: function(result) {
                    if(result.status === "like") {
                        $('.fa-heart' + data._id).html(`<i class="fa fa-heart fa-heart${data._id}"></i>`);
                        $('.countfavorite' + data._id).html(result.num);
                    }else {
                        $('.fa-heart' + data._id).html(`<i class="far fa-heart fa-heart${data._id}"></i>`);
                        $('.countfavorite' + data._id).html(result.num);
                    }
                }
            })
        });
    }

    //new post======================================================================
    $("#form-post").submit(function(e) {
        e.preventDefault();
        var link = /^.*(youtu.be\/|v\/|embed\/|watch\?|youtube.com\/user\/[^#]*#([^\/]*?\/)*)\??v?=?([^#\&\?]*).*/
        var video = $("#post-video").val();
        var idVideo = video.match(link)
        var image = $("#customFile").val();
        var checkimage = image.split('.').splice(-1,1)
        var postcontent = $('#post-content').val()

        var formData = new FormData()
        formData.append('content', postcontent.replace(/\r?\n/g, '<br/>'))

        if (postcontent == "" && checkimage=="" && video == "") {
            $("#errorStatus").html("Bạn chưa có gì để đăng?<br>");
            $("#errorRadio").html("");
            $("#errorImg").html("");
            return false
        } else {
            $("#errorStatus").html("");
        }

        if (checkimage=="") {
            $("#errorImg").html("");
        } else if (checkimage != "bmp" && checkimage != "png" && checkimage != "gjf" && checkimage != "jpg" && checkimage != "jpeg") {
            $("#errorImg").html("Chỉ được phép chọn ảnh!");
            return false;
        } else {
            $("#errorImg").html("");
            formData.append('image', $('#customFile')[0].files[0])
        }

        if (idVideo) {
            formData.append('video', idVideo[3])
            $("#errorRadio").html("");
        } else if (video == "") {
            $("#errorRadio").html("");
        } else {
            $("#errorRadio").html("Địa chỉ youtube không hợp lệ");
            return false;
        }

        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: "/post",
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function(data) {
                var html = ``;
                html += `<div class="card" id="post-content${data.content._id}">
                            <div class="card__body">
                                <a href="/personal?id=${data.user._id}">
                                    <img  class="mr-2" src="${data.user.pic}" width="40" height="40">
                                    <span class="card__username">${data.user.name}</span>
                                </a> °
                                <span class="card__time-up">${new Date(data.content.created).toLocaleString('en-JM')}</span>
                                ${checkuser_post(data.user._id, data.user._id, data.content._id)}
                                <br>
                                <div>
                                    <p class="card__content-up">${data.content.content}</p>
                                    ${check_image(data.content)}
                                    ${check_video(data.content)}
                                    <span class="card__favorite"> <i class="fa fa-heart"></i> <span class="countfavorite${data.content._id}">${data.content.favorites.length}</span> Lượt thích</span>
                                    <a href="#comment" class="${data.content._id}"><span class="card__comments">0 Bình luận</span></a>
                                </div><hr>
                                <div class="card__bottom-up">
                                    <a href="#favorite" class="favorite${data.content._id}"><span class="fa-heart${data.content._id}">${check_favorite(data.content, data.user)}</span> Thích</a>&emsp;
                                    <a href="#comment" class="${data.content._id}"><i class="fa fa-comments"></i> Bình luận</a>&emsp;
                                </div>
                                <div id="${data.content._id}">
                                </div>
                            </div>
                        </div>`;
                $('#new-post').prepend(html);
                favorite(data.content, data.user)
                //Input comment=============================
                input_comment(data.content, data.user)

                $('[data-toggle="popover"]').popover({ html: true, delay: { hide: 150 } });
                //Delete post==========================================
                delete_post(data.content._id)
                    //==================================
                $('#exampleModal').modal('hide');
                $('#form-post').find('textarea').val('');
                $('#customFile').val('');
                $('#customFile').siblings(".custom-file-label").addClass("selected").html('Chọn ảnh');
                $('#post-video').val('');
            }
        })

    })

    //Funtion Input comment============================================
    function input_comment(data, user) {
        $(document).one('click', '.' + data._id, function() {
            var inputComment = `<hr><div class="comment">
                                    <a href="/personal?id=${user._id}">
                                        <img  class="mr-2" src="${user.pic}" width="35" height="35">
                                    </a>
                                    <form id="form-comment${data._id}">
                                        <div class="row">
                                            <div class="col-8 ">
                                                <input type="text" class="form-control thinking comment__input" id="commenContent${data._id}" name="content" placeholder="Viết bình luận..." required>
                                            </div>
                                            <div class="col-3">
                                                <button type="submit" class="btn btn-primary">Gửi</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div id="ipcm${data._id}"></div>
                                <div id="cm${data._id}"></div>
                                <a href="#readmore" id="readmore${data._id}"></a>
                                `
            $('#' + data._id).append(inputComment);
            //Add new comment ============================================
            add_comment(data._id)
                //Load comment =============================================
            var begin = 0
            load_comment(limit_cm, begin, data._id, time)
        });
    }
    //Function check option user for comments ============================================================
    function checkuser(idpostuser, idcurrentuser, id) {
        var option = ''
        if (idpostuser == idcurrentuser) {
            option += `<span tabindex="0" class="d-inline-block" data-trigger="focus" data-toggle="popover" data-content="<a href='#delete' id='delete${id}'>Xóa</a>">
                            <button class="btn"  style="pointer-events: none;" type="button" disabled><i class="fas fa-ellipsis-h"></i></button>
                        </span>`

        }
        return option
    }
    //Function check option user for posts ============================================================
    function checkuser_post(idpostuser, idcurrentuser, id) {
        var option = ''
        if (idpostuser == idcurrentuser) {
            option += `<span tabindex="-1" class="d-inline-block" data-trigger="focus" data-toggle="popover" data-content="<a href='#delete' id='delete${id}'>Xóa</a>">
                            <button class="btn"  style="pointer-events: none;" type="button" disabled><i class="fas fa-ellipsis-h"></i></button>
                        </span>`
        }
        return option
    }
    //Function check image=========================================================
    function check_image(data) {
        var img = ''
        if (data.image) {
            img += `<img class="image-up" src="${data.image}" width="100%" ><br><br>`
        }
        return img
    }

    function check_video(data) {
        var video = ''
        if (data.video) {
            video += `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${data.video}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        }
        return video
    }
    //Function Load comments function=================================
    function load_comment(limit, start, id, time) {
        $.ajax({
            type: 'GET',
            url: '/load_comment',
            data: { limit: limit, start: start, id: id, time: time },
            cache: false,
            success: function(cm) {
                var html = ``;
                cm.comment.forEach(function(data) {
                    html += `<div class="comment-content" id="comment-content${data._id}">
                            <a href="/personal?id=${data.iduser._id}">
                                <img  class="mr-2" src="${data.iduser.pic}" width="35" height="35">
                            </a>
                            <div class="comment-content-text"> 
                                <a href="/personal?id=${data.iduser._id}">
                                    <span class="card__username">${data.iduser.name}</span>
                                </a> °
                                <span class="card__time-up">${new Date(data.created).toLocaleString('en-JM')}</span>
                                ${checkuser(data.iduser._id, cm.user._id, data._id)}
                                <p>${data.content}</p>
                            </div>
                        </div>`
                        //delete comment ======================
                    delete_comment(data._id)

                })
                $('#cm' + id).append(html);

                $('[data-toggle="popover"]').popover({ html: true, delay: { hide: 150 } });

                //===========================
                if (cm.comment == '') {
                    $('#readmore' + id).html("");
                    action_cm = 'active';
                } else {
                    $('#readmore' + id).html("Xem thêm bình luận");
                    action_cm = 'inactive';
                }
            }
        });
    }

    //Function add new comment
    function add_comment(id) {
        $('#form-comment' + id).submit(function(e) {
            e.preventDefault();
            var content = $("#commenContent" + id).val();
            $.ajax({
                url: "/post-comment",
                data: {
                    content: content,
                    idpost: id
                },
                method: "POST",
                success: function(data) {
                    var newcomment = `<div class="comment-content" id="comment-content${data.content._id}">
                                        <a href="/personal?id=${data.user._id}">
                                            <img  class="mr-2" src="${data.user.pic}" width="35" height="35">
                                        </a>
                                        <div class="comment-content-text"> 
                                            <a href="/personal?id=${data.user._id}">
                                                <span class="card__username">${data.user.name}</span>
                                            </a> °
                                            <span class="card__time-up">${new Date(data.content.created).toLocaleString('en-JM')}</span>
                                            <span tabindex="-1" class="d-inline-block" data-trigger="focus" data-toggle="popover" data-content="<a href='#delete' id='delete${data.content._id}'>Xóa</a>">
                                                <button class="btn"  style="pointer-events: none;" type="button" disabled><i class="fas fa-ellipsis-h"></i></button>
                                            </span>
                                            <p>${data.content.content}</p>
                                        </div>
                                    </div>`
                        //delete comment ======================
                    delete_comment(data.content._id)
                        //====================================
                    $('#ipcm' + id).prepend(newcomment);
                    $('#form-comment' + id).find('#commenContent' + id).val('');
                    $('[data-toggle="popover"]').popover({ html: true, delay: { hide: 150 } });
                }
            })
        })
    }

    //Function Delete comment ==========================================
    function delete_comment(id) {
        $(document).on('click', '#delete' + id, function() {
            $.ajax({
                url: "/delete_comment",
                method: "POST",
                data: {
                    id: id
                },
                success: function() {
                    $('#comment-content' + id).remove();
                }
            })
        });
    }
    //Function delete post ==========================================
    function delete_post(id) {
        $(document).on('click', '#delete' + id, function() {
            $.ajax({
                url: "/delete_post",
                method: "POST",
                data: {
                    id: id
                },
                success: function() {
                    $('#post-content' + id).remove();
                }
            })
        });
    }
    //Radio image and video =========================================
    $('input[type="radio"]').click(function() {
        if ($('#imageRadio').is(":checked")) {
            $('#radioCheck').html(`<span>Chọn ảnh:</span>
                                    <div class="custom-file mb-3">
                                        <input type="file" class="custom-file-input" id="customFile" name="image">
                                        <label class="custom-file-label" for="customFile">Chọn ảnh</label>
                                        <span id="errorImg" class="error-input"></span>
                                    </div>
                                    <input type="hidden" class="form-control" id="post-video" name="video" placeholder="Nhập link youtube">`)
        } else if ($('#videoRadio').is(":checked")) {
            $('#radioCheck').html(`<div class="custom-file mb-3 display-none">
                                        <input type="file" class="custom-file-input" id="customFile" name="image">
                                        <label class="custom-file-label" for="customFile">Chọn ảnh</label>
                                    </div>
                                    <span>Chọn video (Chỉ hỗ trợ Youtube):</span>
                                    <input type="text" class="form-control" id="post-video" name="video" placeholder="Nhập link youtube">
                                    <span id="errorRadio" class="error-input"></span>`)
        }
        custom_form()
    });
    //Upload file====================================================
    function custom_form() {
        $(".custom-file-input").on("change", function() {
            var fileName = $(this).val().split("\\").pop();
            $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
        });
    }
    custom_form()
        //Socket============================================
    let socket = io();
    socket.on("send", function(data) {
        $('#socketio').html(`<div class="fixed-top alert alert-primary alert-dismissible content-body__alert">
                                <button type="button" class="close" data-dismiss="alert">&times;</button>
                                <i class="fas fa-bell"></i> 
                                ${data.idcategory.name} vừa đăng thông báo mới: <a href="/notificationdetail/${data._id}">${data.title}</a>
                            </div>`)
    });

    //Check validate login form=========================================
    $("#loginForm").submit(function() {
        var status = false;
        if ($("#username").val().trim() == "") {
            $("#errorUsername").html("Vui lòng nhập username!");
            status = false;
        } else {
            $("#errorUsername").html("");
            status = true;
        }

        if ($("#password").val().trim() == "") {
            $("#errorPassword").html("Vui lòng nhập password!");
            status = false;
        } else {
            $("#errorPassword").html("");
        }
        return status;
    });
    //Check validate add user form=========================================
    $("#adduserForm").submit(function() {
        var checkbox = $(".idcategory:checked").length;
        var displayName = $("#displayName").val();
        var username = $("#username").val();
        var password = $("#password").val();
        var repassword = $("#repassword").val();
        var status = false;
        if (displayName.trim() == "") {
            $("#errorDisplayName").html("Vui lòng nhập tên hiển thị!");
            status = false;
        } else {
            $("#errorDisplayName").html("");
            status = true;
        }

        if (username.trim() == "") {
            $("#errorUsername").html("Vui lòng nhập tên đăng nhập!");
            status = false;
        } else if (username.length < 6) {
            $("#errorUsername").html("Tên đăng nhập ít nhất 6 ký tự!");
            status = false;
        } else {
            $("#errorUsername").html("");
        }

        if (password.trim() == "") {
            $("#errorPassword").html("Vui lòng nhập mật khẩu!");
            status = false;
        } else if (password.length < 6) {
            $("#errorPassword").html("Tên đăng nhập ít nhất 6 ký tự!");
            status = false;
        } else {
            $("#errorPassword").html("");
        }

        if (repassword.trim() == "") {
            $("#errorRepassword").html("Vui lòng xác nhận lại mật khẩu!");
            status = false;
        } else if (password != repassword) {
            $("#errorRepassword").html("Mật khẩu không khớp!");
            status = false;
        } else {
            $("#errorRepassword").html("");
        }

        if (checkbox < 1) {
            $("#errorCheckbox").html("Vui lòng chọn ít nhất 1 chuyên mục!");
            status = false;
        } else {
            $("#errorCheckbox").html("");
        }

        return status;
    });
    //Check validate add notice form=========================================
    $("#addnoticeForm").submit(function() {
        var title = $("#title").val();
        var category = $("#category").val();
        var content = $("#content").val();
        var status = false;
        if (title.trim() == "") {
            $("#errorTitle").html("Vui lòng nhập tiêu đề!");
            status = false;
        } else {
            $("#errorTitle").html("");
            status = true;
        }

        if (category.trim() == "") {
            $("#errorCategory").html("Vui lòng chọn chuyên mục!");
            status = false;
        } else {
            $("#errorCategory").html("");
        }

        if (content.trim() == "") {
            $("#errorContent").html("Vui lòng nhập nội dung!");
            status = false;
        } else {
            $("#errorContent").html("");
        }

        return status;
    });
    //Check validate change password form=========================================
    $("#changpassForm").submit(function() {
        var currentpass = $("#currentpass").val();
        var newpass = $("#newpass").val();
        var repass = $("#repass").val();
        var status = false;
        if (currentpass.trim() == "") {
            $("#errorCurrentpass").html("Vui lòng nhập mật khẩu hiện tại!");
            status = false;
        } else if (currentpass.length < 6) {
            $("#errorCurrentpass").html("Mật khẩu ít nhất 6 ký tự!");
            status = false;
        } else {
            $("#errorCurrentpass").html("");
            status = true;
        }

        if (newpass.trim() == "") {
            $("#errornNewpass").html("Vui lòng nhập mật khẩu mới!");
            status = false;
        } else if (newpass.length < 6) {
            $("#errornNewpass").html("Mật khẩu ít nhất 6 ký tự!");
            status = false;
        } else {
            $("#errornNewpass").html("");
        }

        if (repass.trim() == "") {
            $("#errorRepass").html("Vui lòng xác nhận lại mật khẩu!");
            status = false;
        } else if (newpass != repass) {
            $("#errorRepass").html("Mật khẩu không khớp!");
            status = false;
        } else {
            $("#errorRepass").html("");
        }

        return status;
    });
    //Check validate update info form=========================================
    $("#updateinfoForm").submit(function() {
        var name = $("#name").val();
        var classs = $("#class").val();
        var faculty = $("#faculty").val();
        var status = false;
        if (name.trim() == "") {
            $("#errorName").html("Vui lòng nhập tên hiển thị!");
            status = false;
        } else {
            $("#errorName").html("");
            status = true;
        }

        if (classs.trim() == "") {
            $("#errorClass").html("Vui lòng nhập lớp!");
            status = false;
        } else {
            $("#errorClass").html("");
        }

        if (faculty.trim() == "") {
            $("#errorFaculty").html("Vui lòng nhập khoa!");
            status = false;
        } else {
            $("#errorFaculty").html("");
        }

        return status;
    });
    //Check validate update avt form=========================================
    $("#updateAvtForm").submit(function() {
        var image = $("#image").val();
        var checkimage = image.split('.').splice(-1,1)
        var status = false;
        if (image.length < 1) {
            $("#errorImage").html("Vui lòng chọn ảnh!");
            status = false;
        } else if (checkimage != "bmp" && checkimage != "png" && checkimage != "gjf" && checkimage != "jpg" && checkimage != "jpeg") {
            $("#errorImage").html("Chỉ được phép chọn ảnh!");
            status = false;
        } else {
            $("#errorImage").html("");
            status = true;
        }

        return status;
    });
    //Dislay error for Lognin page=================================
    window.setTimeout(function() {
        $(".alert-login").fadeTo(500, 0).slideUp(500, function() {
            $(this).remove();
        });
    }, 6000);

    //Ckeditor for textarea content==================================
    ClassicEditor
        .create(document.querySelector('.add-user #content'))
        .catch(error => {
            console.error(error);
        });

    //Search autocomplete========================================
    $("#searchForm").submit(function() {
        var search = $("#search").val();
        if (search.trim() == "") {
            return false;
        } else {
            return true
        }
    });
    $('#search').keyup(function(){  
        var data = '' 
        data = $(this).val();
        search(data);
    });
    function search(data) {
        var dataAuto = []
        $.ajax({
            type: 'GET',
            url: '/autocomplete',
            data: {data},
            cache: false,
            success: function(result) {
                result.forEach(function(data){
                    dataAuto.push(data)
                })
                $(function() {
                    $("#search").autocomplete({
                        source: function (req, res) {
                                    res($.map(dataAuto, function (value, key) {
                                        return {
                                            label: value.name,
                                            value: value.name,
                                            id: value._id,
                                            img: value.pic
                                        }
                                    }));
                                },
                        select: function( event, ui ) { 
                            window.location.href = '/personal?id=' + ui.item.id
                            return false;
                        }
                    }).autocomplete( "instance" )._renderItem = function( ul, item ) {
                        return $( "<li><div><img src='"+item.img+"' width='40' height='40'> <span>"+item.value+"</span></div></li>" ).appendTo( ul );
                    };
                });
            }
        });
    }

});