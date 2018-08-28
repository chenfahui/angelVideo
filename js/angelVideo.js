
/*视频播放*/
var VOLUME = (window.localStorage && localStorage.getItem('volume')) ? localStorage.getItem('volume') : 0.5;/*音量*/

(function($){

    $.angelvideo = function(data){
        $.angelvideo.init(data);
        $.angelvideo.closeCallback = data ? data.closeCallback : '';
    }

    $.extend($.angelvideo,{
        settings:{
            opacity     : 0.3,
            overlay     : true,
            videoHtml:'\
              <div id="angelvideo" class="player-dialog" style="display:none;">\
                <div class="player-dialog-body"></div>\
                <div class="player-dialog-tit">全部视频</div>\
                <div class="player-dialog-list"></div>\
                <div class="player-dialog-close" onclick="$.angelvideo.close();"></div>\
                <div class="player-dialog-move"></div>\
              </div>'
        },
        init:function(data){
            $('.player-dialog').remove();
            $('body').append($.angelvideo.settings.videoHtml);
            $('.player-dialog').css({
                'width':(data && data.width) ? data.width : 800,
                'height':(data && data.height) ? data.height : 340
            });
            var listHtml = '';
            var listSize = (data && data.video) ? data.video.length : 0; 
            if(listSize){
                for(var i = 0; i < listSize; i++){
                    listHtml += '<li class='+ ((i == 0) ? "current" : "not") +' onclick="$.angelvideo.play({video:[{title:\''+data.video[i].title+'\', uri:\''+data.video[i].uri+'\'}]})">'+data.video[i].title+'</li>';
                }
            }
            $('.player-dialog-list').on('click', 'li', function(){
                $(this).addClass('current').siblings('li').removeClass('current');
            }).html('<ul>'+listHtml+'</ul>');

            $.angelvideo.play(data);
            $.angelvideo.showOverlay(data);
            $.angelvideo.position($('.player-dialog'));
            $.angelvideo.move();
        },
        play:function(data){
            var uri = (data && data.video && data.video[0] && data.video[0].uri) ? data.video[0].uri : '';
            if(!uri) return;
            var playerHtml = '\
                <div class="player-wrap" id="playerWrap">\
                    <video class="player-video" width="100%" height="100%" preload="auto" id="angelVideo">\
                        <source src="'+uri+'" type="video/mp4">\
                    </video>\
                    <div class="player-controls transition">\
                        <div class="btn play" title="播放"><span class="icon"></span></div>\
                        <div class="btn pause hide" title="暂停"><span class="icon"></span></div>\
                        <div class="played" title="已播放">00:00</div>\
                        <div class="tracker drag" title="进度条"><span class="thumb"></span></div>\
                        <div class="duration" title="总时间">00:00</div>\
                        <div class="copy">复制链接</div>\
                        <div class="copy-content">'+uri+'</div>\
                        <div class="volume drag"><span class="thumb"></span></div>\
                        <div class="btn voice" title="声音"><span class="icon"></span></div>\
                    </div>\
                    <div class="player-mark">\
                        <div class="btn load hide" title="加载中..."><span class="icon"></span></div>\
                        <div class="btn play" title="播放"><span class="icon"></span></div>\
                        <div class="btn pause hide" title="暂停"></div>\
                        <div class="btn again hide" title="重播"><span class="icon"></span></div>\
                        <div class="btn full" title="全屏"><span class="icon"></span></div>\
                        <div class="error"></div>\
                    </div>\
                </div>'
            $('.player-dialog-body').html(playerHtml);

            var player = {};

            /*对象*/
            var $angelVideo = $('#angelVideo')[0],
                    $wrap = $('.player-wrap'),
                    $mark = $('.player-mark'),
                    $controls = $('.player-controls'),
                    $play = $wrap.find('.play'),
                    $pause = $wrap.find('.pause'),
                    $played = $wrap.find('.played'),
                    $again = $wrap.find('.again'),
                    $duration = $wrap.find('.duration'),
                    $load = $wrap.find('.load'),
                    $tracker = $wrap.find('.tracker'),/*进度拖动范围*/
                    $volume = $wrap.find('.volume'),/*音量拖动范围*/
                    $drag = $wrap.find('.drag'),
                    $error = $wrap.find('.error'),
                    isFullscreen = false,/*是否处于全屏*/
                    isDrag = false,/*左键是否按住*/
                    isPlay = false,/*播放中*/
                    controlsTimeout;/*控制器定时隐藏*/

            /*控制条隐藏*/
            player.controlsHide = function(){
                clearTimeout(controlsTimeout);
                $controls.removeClass('player-controls-hide');
                if(!isPlay) return;
                $('.pause',$mark).removeClass('hide');
                controlsTimeout = setTimeout(function(){
                    $controls.addClass('player-controls-hide');
                    $('.pause',$mark).addClass('hide');
                },3000);
            }

            /*播放*/
            player.inPlay = function(){
                if(!$angelVideo.canPlayType('video/mp4')){/*不支持视频*/
                    $error.html('手机不支持视频播放');
                    return;
                }
                isPlay = true;
                $angelVideo.play();
                $($angelVideo).addClass('player-video-fit');
                $play.addClass('hide');
                $load.addClass('hide');
                $pause.removeClass('hide');
                $again.addClass('hide');
                player.controlsHide();
                $angelVideo.volume = VOLUME;
            }
            /*暂停*/
            player.inPause = function(){
                $angelVideo.pause();
                $play.removeClass('hide');
                isPlay = false;
                player.controlsHide();
                $pause.addClass('hide');
            }
            /*重新加载*/
            player.reload = function(){
                $angelVideo.load();
                $play.addClass('hide');
                $again.addClass('hide');
                $pause.removeClass('hide');
            }

            /*全屏切换*/
            player.inFull = function(){
                if(isFullscreen){
                    player.exitFullscreen();
                }else{
                    player.fullScreen();
                }
            }
            player.inFullChange = function(){
                if(isFullscreen){
                    $mark.find('.full').addClass('not-full');
                    $wrap.addClass('player-wrap-full');
                }else{
                    $wrap.removeClass('player-wrap-full');
                    $mark.find('.full').removeClass('not-full');
                }    
            }

            /*进步条*/
            player.progress = function(){
                player.controlsHide();
            }


            /*格式化时间*/
            player.timeFormat = function(time){
                var hour = minute = seconds = 0
                hour = parseInt(time/60/60);
                minute = parseInt((time - hour)/60);
                seconds = parseInt(time - hour*60 - minute*60);

                if(hour < 10) hour = '0'+hour;
                if(minute < 10) minute = '0'+minute;
                if(seconds < 10) seconds = '0'+seconds;
                if(hour > 0){
                    time = hour +':'+ minute +':'+ seconds;
                }else{
                    time = minute +':'+ seconds;
                }
                return time;
            }

            /*进度条*/
            player.thumb = function(obj){
                var $thumb,/*显示对象*/
                    thumbDefaultX = 0,/*拖动前的x坐标*/
                    thumbMouseX = 0,/*拖动后的x坐标*/
                    thumbWidth = 0,/*进步条拖动前的宽度*/
                    maxWidth,/*进度条最大宽度*/
                    pace = 1;/*1：视频进度，2：音量*/
                obj.on('mousedown',function(e){/*PC*/
                    $thumb = $(this).find('.thumb');/*显示对象*/
                    maxWidth = $(this).width();
                    isDrag = true;
                    thumbDefaultX = e.pageX;
                    thumbMouseX = thumbDefaultX - $thumb.offset().left;    
                    $thumb.removeClass('transition');
                    $thumb.css({width:thumbMouseX});
                    thumbWidth = $thumb.width();
                    if($(this).hasClass('tracker')){
                        if($angelVideo.duration) $angelVideo.currentTime = $angelVideo.duration * thumbMouseX / maxWidth;/*同步播放进度*/            
                        pace = 1;
                    }else{
                        $angelVideo.volume = thumbMouseX / maxWidth;
                        VOLUME = thumbMouseX / maxWidth;
                        if(window.localStorage) localStorage.setItem('volume', VOLUME)
                        pace = 2;
                    }
                    player.controlsHide();
                })
                $(document).on('mousemove',function(e){/*PC*/
                    e.preventDefault();
                    if(!isDrag) return false;
                    thumbMouseX = e.pageX;
                    var w = parseInt(thumbMouseX-thumbDefaultX)+thumbWidth;
                    if(w < 0)/*防止拖动出左边*/
                        w = 0;
                    if(w > maxWidth)/*防止拖动出右边*/
                        w = maxWidth;
                    if(isDrag){/*确认鼠标按住*/
                        $thumb.css({width:w});
                        if(pace == 1){
                            if($angelVideo.duration) $angelVideo.currentTime = $angelVideo.duration * w / maxWidth;/*同步播放进度*/
                        }else{
                            $angelVideo.volume = w / maxWidth;
                            VOLUME = w / maxWidth;
                            if(window.localStorage) localStorage.setItem('volume', VOLUME)
                        }
                        player.controlsHide();
                    }
                }).on('mouseup',function(e){/*PC*/
                    e.preventDefault();
                    isDrag = false;
                });
            }

            /*进入全屏*/
            player.fullScreen = function() {
                var ele = document.getElementById('playerWrap');
                var requestMethod = ele.requestFullScreen || /*W3C*/
                ele.webkitRequestFullScreen ||    /*Chrome等*/
                ele.mozRequestFullScreen || /*FireFox*/
                ele.msRequestFullScreen; /*IE11*/
                if (requestMethod) {
                    requestMethod.call(ele);
                }
                else if (typeof window.ActiveXObject !== "undefined") {/*for Internet Explorer*/
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript !== null) {
                        wscript.SendKeys("{F11}");
                    }
                }
            }
            /*退出全屏*/
            player.exitFullscreen = function() {
                var de = document;
                var exitMethod = de.exitFullscreen || /*W3C*/
                    de.mozCancelFullScreen ||    /*Chrome等*/
                    de.webkitExitFullscreen || /*FireFox*/
                    de.webkitExitFullscreen; /*IE11*/
                    if (exitMethod) {
                        exitMethod.call(de);
                    }
                    else if (typeof window.ActiveXObject !== "undefined") {/*for Internet Explorer*/
                        var wscript = new ActiveXObject("WScript.Shell");
                        if (wscript !== null) {
                            wscript.SendKeys("{F11}");
                        }
                    }
            }

            /**/
            player.fullScreenChange = function(){

                document.addEventListener("fullscreenchange", function () {
                    isFullscreen = document.fullscreenElement;
                    player.inFullChange()
                }, false);

                document.addEventListener("msfullscreenchange", function () {
                    isFullscreen = document.msFullscreenElement;
                    player.inFullChange()
                }, false);

                document.addEventListener("mozfullscreenchange", function () {
                    isFullscreen = document.mozFullScreen;
                    player.inFullChange()
                }, false);

                document.addEventListener("webkitfullscreenchange", function () {
                    isFullscreen = document.webkitIsFullScreen;
                    player.inFullChange()
                }, false);

            };

            /*视频被加载*/
            $angelVideo.addEventListener('loadedmetadata', function () {
                if(this.duration) $duration.html(player.timeFormat(this.duration));
                $played.html('00:00');
            })
            /*正在下载音频 兼容部分浏览器 时间显示*/
            $angelVideo.addEventListener('progress', function () {
                if(this.duration && this.currentTime < 1) $duration.html(player.timeFormat(this.duration));
            })

            /*开始播放时*/
            $angelVideo.addEventListener('play', function () {
                $load.addClass('hide');
                isPlay = true;
                player.controlsHide();
                $play.addClass('hide');
                $pause.removeClass('hide');
            })

            /*视频就绪*/
            $angelVideo.addEventListener('playing', function () {
                $load.addClass('hide');
                player.controlsHide();
            })

            /*视频暂停*/
            $angelVideo.addEventListener('pause', function () {
                player.inPause();
            })

            /*当前播放的进度*/ 
            $angelVideo.addEventListener('timeupdate', function () {
                $played.html(player.timeFormat(this.currentTime));
                if(this.duration && this.currentTime < 1){
                    $duration.html(player.timeFormat(this.duration));
                }
                if(this.currentTime < this.duration){
                    $again.addClass('hide');
                    if(!isPlay){                        
                        $play.removeClass('hide');
                        $('.play',$controls).removeClass('hide');
                    }
                }
                $tracker.find('.thumb').css({width:this.currentTime/this.duration*$tracker.width()});/*同步进度条*/
            })
             
            /*视频缓冲*/
            $angelVideo.addEventListener('waiting', function () {
                $load.removeClass('hide');
            })

            /*发生错误*/
            $angelVideo.addEventListener('error', function () {
                $error.html('系统繁忙，请刷新页面重试！');
            })

            /*播放结束时触发*/
            $angelVideo.addEventListener('ended', function () {
                $play.addClass('hide');
                $again.removeClass('hide');
                $('.play',$controls).removeClass('hide');
            })


            $volume.find('.thumb').css({width:VOLUME*100+'%'});/*记录音量*/
            player.inPlay();/*自动播放*/
            player.thumb($drag);
            player.fullScreenChange();
            if(navigator.userAgent.indexOf("MSIE") > -1) $error.html('建议使用浏览器：谷歌、火狐');

            $wrap.on('mousemove',function(){
                player.controlsHide();
            }).on('click','.play',function(){
                player.inPlay();
            }).on('click','.pause',function(){
                player.inPause();
            }).on('click','.pro',function(){
                player.progress();
            }).on('click','.full',function(){
                player.inFull();
            }).on('click','.again',function(){
                player.reload();
                player.inPlay();
            }).on('click', '.copy', function(){
                var self = this;
                var range = document.createRange();
                range.selectNode($('.copy-content')[0]);
                var selection = window.getSelection();
                if(selection.rangeCount > 0) selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('copy');
                $(self).html('复制成功');
                setTimeout(function(){
                    $(self).html('复制链接');
                },2000);
            }).on('click', '.voice', function(){
                $angelVideo.muted = !$angelVideo.muted;
                if($angelVideo.muted){
                    $volume.find('.thumb').addClass('hide');
                    $(this).addClass('voice-muted');
                }else{
                    $volume.find('.thumb').removeClass('hide');
                    $(this).removeClass('voice-muted');
                }
            });

        },
        close:function(){
            $(".player-dialog").fadeOut(function(){
                $(this).remove().find('iframe').remove();
            });
            $.angelvideo.hideOverlay();
            if($.angelvideo.closeCallback && $.angelvideo.closeCallback instanceof Function){
                $.angelvideo.closeCallback();
                $.angelvideo.closeCallback = null;
            }
        },
        /*显示位置*/
        position:function(obj){
            var left = $(window).width() / 2 - ($(obj).outerWidth() / 2) + $(window).scrollLeft();
            var top = $(window).height() / 2 - ($(obj).outerHeight() / 2) + $(window).scrollTop();
            if(top < $(window).scrollTop())
                top= $(window).scrollTop() + 10;
            $(obj).css({left:left,top:top}).fadeIn();
        },
        /*显示遮罩*/
        showOverlay:function(data){
            var overlay = $.angelvideo.settings.opacity;
            if(!$(".player-dialog-overlay").length) $("body").append('<div class="player-dialog-overlay"></div>');
            if(data && data.overlayOpacity)  overlay = data.overlayOpacity;
            $(".player-dialog-overlay").css({'opacity':overlay});
        },    
        /*移除遮罩*/
        hideOverlay:function(){
            $(".player-dialog-overlay").fadeOut(function(){$(this).remove()});
        },
        /*拖动*/
        move:function(){
          var box = $('.player-dialog'),/*弹窗*/
                handle = $('.player-dialog-move'),/*拖动对象*/
                isClick = false,/*左键是否按住*/
                defaultX,/*拖动前的x坐标*/
                defaultY,/*拖动前的y坐标*/
                mouseX,/*拖动后的x坐标*/
                mouseY,/*拖动后的y坐标*/
                divTop,/*弹窗拖动前的x坐标*/
                divLeft;/*弹窗拖动前的y坐标*/
          handle.mousedown(function(e){
            isClick = true;
            defaultX = e.pageX;
            defaultY = e.pageY;
            divTop = box.position().top;
            divLeft = box.position().left;
          });
          $(document).mousemove(function(e){
            if(!isClick) return;
            e.preventDefault();
            mouseX = e.pageX;
            mouseY = e.pageY;
            var left = parseInt(mouseX-defaultX)+divLeft;
            var top = parseInt(mouseY-defaultY)+divTop;
            var boxW = box.outerWidth() + 45;/*45：关闭按钮的宽度*/
            var boxH = box.outerHeight();
            if(left < 0)/*防止拖动出左边*/
              left = 0;
            if(top < 0)/*防止拖动出顶部*/
              top = 0;
            if(left+boxW > $(document).width())/*防止拖动出右边*/
              left = $(document).width() - boxW;
            if(top+boxH > $(document).height())/*防止拖动出底边*/
              top = $(document).height() - boxH;
            if(isClick){/*确认鼠标按住*/
              box.css({top:top,left:left});
            }
          });
          $(document).mouseup(function(e){
            isClick = false;
          });
        }
    });
    
    $(window).resize(function(){
        $.angelvideo.position($('.player-dialog'));
    });

})(jQuery);

