//localStorage 处理
(function(){
    //Util 自调用闭包函数  负责 返回getJSONP、set/get storage
    var Util=(function(){

        var prefix='_reader'; //本地存储属性前缀
        var StorageGetter=function(key){
            return localStorage.getItem(prefix+key)
        }
        var StorageSetter=function(key,val){
            return localStorage.setItem(prefix+key,val)
        }
//JSONP
        var getJSONP=function(url,callback){
            return $.jsonp({
                url:url,
                cache:true,
                callback:'duokan_fiction_chapter',
                success:function(result){
                    //debugger 断点调试查看转码过程
                    var data=$.base64.decode(result)
                    var json=decodeURIComponent(escape(data));
                    callback(json);
                }
            })
        }
        return {//这个返回的命名空间都需要Util来调用
            getJSONP:getJSONP,
            StorageSetter:StorageSetter,
            StorageGetter:StorageGetter
        }
    })()

//页面初始化所需全局变量
    var readerModel,readerUI;
//localStorage init
    var initfontsize=Util.StorageGetter('font_size')
    var initbackground=Util.StorageGetter('background_color');
    var neightdisplay=Util.StorageGetter('neight')
    var init360=Util.StorageGetter('background360');
    var Chapterid=Util.StorageGetter('Chapterid')
    var initscroll=Util.StorageGetter('scroll')

//localStorage font_size

    if(!initfontsize){
        initfontsize=14
    }else{
        parseInt(initfontsize)
        $('#format_container').css('font-size',initfontsize+'px')
    }
    //localStorage background

    if(!initbackground){
        initbackground='#e9dfc7'
    }else{
        $('body').css('background',initbackground)
    }
    //localStorage neight display

    if(neightdisplay=='true'){
        $('#neight').hide()
        $('#neight1').show()
    }else{
        $('#neight').show()
        $('#neight1').hide()
    }
    //localStorage init360
    if(init360){
        $('.bk-container-current').eq(init360-1).show()
    }
    var Dom={
        top_nav:$('#top_nav'),
        bottom_nav:$('#bottom_nav'),
        mulu:$('#mulu'),
        neight:$('neight'),
        font_set_button:$('#font_set_button'),
        font_container:$('#font_container'),
        nav_pannel_bk:$('.nav-pannel-bk'),
        format_container:$('#format_container')
    }
//入口函数
    function main(){

        readerModel=ReaderModel();//调用ajax入口函数

        readerUI=ReaderBaseFrame($('#format_container'))//阅读器UI渲染函数调用 传入container
        readerModel.init(function(){
            readerUI(arguments[0])
        })
        EventHanlder();//调用事件的入口函数

    }
    function ReaderModel(){
        //ajax
        if(Util.StorageGetter('Chapterid')){
            var Chapter_id=Util.StorageGetter('Chapterid')
        }else{
            var Chapter_id;
        }
        var maxChapter;
//init 方法用来完成整个请求数据以及请求数据后对数据的处理和在页面中的渲染
        var init = function(UIcallback){//页面渲染方法 参数为页面渲染的回调函数


            getFictionInfo(function(){  //先执行请求章节列表的json数据 然后在回调函数中执行请求章节内容的getCurChapterContent函数

                getCurChapterContent(Chapter_id,function(){//先请求章节内容，然后在执行回调函数渲染请求到的内容在页面上
                    //to do
                    UIcallback&&UIcallback(arguments[0])
                })
            })

        }
//请求所有章节信息
        var getFictionInfo=function(callback){
            $.get('data/chapter.json',function(){
                //console.log(data); 注意看请求到的数据的格式哟
                //获得章节信息的回调
                if(!Util.StorageGetter('Chapterid')) Chapter_id = arguments[0].chapters[1].chapter_id; //Charter_id 赋值为返回json对象的chapters属性 该属性是一个数组数组成员为json格式的对象，这个对象的chapter_id属性值是数字 代表的是第几章 arguments
                maxChapter = arguments[0].chapters.length
                callback&&callback()//然后执行getFictionInfo的回调函数
            },'json')

        }
//获得章节内容函数
        var getCurChapterContent=function(chapter_id,callback){


            $.get('data/data'+chapter_id+'.json',function(data){//用get方法获取要获取的小说内容  参数1为 字符串拼接的路径，第二个参数为回掉函数在$.get执行完以后 获得到请求结果后 第三个参数为规定的请求结果的类型为json格式
                //console.log(data)  返回一个data 为json对象 很重要下面的代码是根据这个json对象的内容来进行编程的。 在工作中很多时候不能等后台实现功能了再去写前端逻辑，可以先拟定一份数据格式
                if(data.result==0){     //验证该json对象内的属性 如果验证成功说明data被成功的请求到了

                    var url=data.jsonp  //url 为json 对象的jsonp属性
                    Util.getJSONP(url,function(){ //调用jsonp方法

                        callback&&callback(arguments[0]) //调用getCurChapterContent 方法的回调函数参数为data也就是通过获取章节内容得到的返回结果
                    })
                }
            },'json')
        }
//请求上一章内容
        var prevChapter=function(UIcallback){
            //利用readermodel 作用域内的变量来控制哪一章
            Chapter_id = parseInt(Chapter_id,10);//防止请求到的数据时遇到010这种格式的，这样的话会变成8进制，后面写个10强制将进制设置为10进制
            if(Chapter_id==0){
                return
            }
            Chapter_id-=1
            Util.StorageSetter('Chapterid',Chapter_id)
            getCurChapterContent(Chapter_id,UIcallback)//计算过章节序号后调用获得章节内容的getCurChapterContent函数，
        }
//请求下一章的内容
        var nextChapter=function(UIcallback){
            Chapter_id = parseInt(Chapter_id,10);
            if(Chapter_id==maxChapter){
                return
            }
           Chapter_id+=1;
            Util.StorageSetter('Chapterid',Chapter_id)
            getCurChapterContent(Chapter_id,UIcallback)
        }
        return{//返回一个对象，这样的好处是返回值拥有命名空间 只有通过ReaderModel访问到里面的值 因为readerModel存在闭包需要return，在调用的时候内部的一些函数才能被外部访问到
            init:init,
            nextChapter:nextChapter,
            prevChapter:prevChapter
        }
    }

    function ReaderBaseFrame(container){
        //Frame UI Node
        function parseChapterData(){//数据字符串拼接
            //console.log(arguments[0])
            var jsonObj = JSON.parse(arguments[0]);//jquery中会默认将数据当作参数进行传递
            //console.log(jsonObj) 二元数组哦
            var html="<h4>"+jsonObj.t+'</h4>';
            for(var i=0;i<jsonObj.p.length;i++){
                html+='<p>'+jsonObj.p[i]+'</p>';
            }
            return html//返回整个字符串
        }
        return function(){//返回一个函数，函数的
            container.html(parseChapterData(arguments[0]))
            if(initscroll){
                window.scrollTo(0,initscroll)
            }
        }
    }

//事件绑定
    function EventHanlder(){
        //屏幕中心 点击显示上下功能菜单
        $('#action_mid').click(function(){
            if(Dom.top_nav.css('display')=='none'){
                Dom.bottom_nav.show();
                Dom.top_nav.show()
            }else{
                Dom.font_container.hide()
                Dom.nav_pannel_bk.hide()
                Dom.bottom_nav.hide();
                Dom.top_nav.hide();
            }
        })
        //唤出字体以及背景色选项卡
        $('#font_set_button').click(function(){
            if(Dom.font_container.css('display')=='none'){
                Dom.font_container.show()
                Dom.nav_pannel_bk.show()
                this.className='current'
            }else{
                Dom.font_container.hide()
                Dom.nav_pannel_bk.hide()
                this.className=''
            }
        })
        //切换夜间模式
        $('#neight').click(function(){
            initbackground='#0f1410'
            init360=6
            $(this).hide()
            $('#neight1').show()
            $('body').css('background',initbackground)
            $('.bk-container-current').hide()
            $('.bk-container-current').eq(5).show()
            Util.StorageSetter('neight','true')
            Util.StorageSetter('background_color',initbackground)
            Util.StorageSetter('background360',init360)

        })
        //切换日间模式
        $('#neight1').click(function(){
            initbackground='#e9dfc7'
            init360=2
            $(this).hide()
            $('#neight').show()
            $('body').css('background',initbackground)
            $('.bk-container-current').hide()
            $('.bk-container-current').eq(1).show()
            Util.StorageSetter('neight','false')
            Util.StorageSetter('background_color','#e9dfc7')
            Util.StorageSetter('background360',init360)
        })
        //放大字体
        $('#large-font').click(function(){
            if(initfontsize<24){
                initfontsize++
                Dom.format_container.css('font-size',initfontsize)
                Util.StorageSetter('font_size',initfontsize)
            }
        })
        //缩小字体
        $('#small-font').click(function(){
            if(initfontsize>13){
                initfontsize--
                Dom.format_container.css('font-size',initfontsize)
                Util.StorageSetter('font_size',initfontsize)
            }
        })
        //background切换
        $('.bk-container').click(function(){
            if($(this).index()==6){
                $('#neight').hide()
                $('#neight1').show()
                Util.StorageSetter('neight','true')
            }else{
                if($('#neight').css('display')=='none'){
                    $('#neight').show()
                    $('#neight1').hide()
                    Util.StorageSetter('neight','false')
                }
            }
            initbackground=$(this).data('color')
            init360=$(this).index()
            $('.bk-container-current').hide()
            $(this).children().show()
            $('body').css('background',initbackground)
            Util.StorageSetter('background_color',initbackground)
            Util.StorageSetter('background360',init360)
        })

        $(window).scroll(function(){
            Dom.font_container.hide()
            Dom.nav_pannel_bk.hide()
            Dom.bottom_nav.hide();
            Dom.top_nav.hide();
            Util.StorageSetter('scroll',window.scrollY)

        })

        $('#prev_button').click(function(){
            //获得章节翻页的数据>把数据拿出来渲染
            readerModel.prevChapter(function(){
                readerUI(arguments[0])  //回调函数中调用ReaderBaseFrame
                console.log()
                window.scrollTo(0,document.body.scrollHeight)
            })
        })
        $('#next_button').click(function(){
            readerModel.nextChapter(function(){
                readerUI(arguments[0])
                window.scrollTo(0,0);//交互优化在点击下一章的时候让页面回到顶部
            })
        })

    }
    main()
})()
