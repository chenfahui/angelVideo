# angelVideo
简易video弹窗播放器，依赖jQuery，支持多个视频、可拖动。


function dialogPlay(){
    $.angelvideo({
        width:800,
        height:340,
        video:[
            {
                title:'原始视频1',
                uri:'http://vjs.zencdn.net/v/oceans.mp4'
            },
            {
                title:'原始视频2',
                uri:'http://vjs.zencdn.net/v/oceans.mp4'
            },
            {
                title:'剪辑视频',
                uri:'http://vjs.zencdn.net/v/oceans.mp4'
            }
        ]
    });
}
