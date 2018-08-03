//轮播图索引
var index = 0;
//轮播图宽度
var imgWidth = 3840;
//轮播图高度
var imgHight = 1920;

//iframe宽度
var iframeWidth = 1920;

//iframe高度
var iframeHeight = 1080 - 64;

//轮播图ul容器
var sliderul;

//轮播图页面数
var count;

//页码容器
var pageul;

//轮播图数组
var imgs;

//所有大屏的链接地址
var urls;

//所有大屏的容器
var iframes = [];

//用于统计iframe按顺序加载优化性能的索引值
var updateIframeCount = 0;

//轮播图轮播的定时器
var timer;

//轮播图轮播的周期毫秒
var cycle;

//卸载定时器
window.onunload = function () {
    timer && clearInterval(timer);
}

window.onload = function () {

    //请求配置文件
    var req = new XMLHttpRequest();
    req.open('GET', './config/config.json');
    req.send(null);
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            if (req.status === 200) {
                var flag = false;
                try {
                    var res = JSON.parse(req.responseText);
                    //设置大屏链接
                    urls = res.urls;
                    //设置轮询周期
                    cycle = (+res.cycle) * 1000;
                    if (!urls) {
                        alert('配置文件中路径为空');
                    }
                    if (!cycle) {
                        alert('配置文件中轮询周期为空，采用默认50秒');
                        cycle = 5000;
                    }
                    flag = true;
                } catch (e) {
                    alert('配置文件不是正确的JSON格式');
                }

                if (flag) {
                    initSlider();
                }
            } else {
                alert('请求配置文件失败');
            }
        }
    }
};

function stop() {
    timer && clearInterval(timer);
}

function go() {
    timer && clearInterval(timer);
    //自动播放
    timer = setInterval(function () {
        moveRight();
    }, cycle);
}

function $(id) {
    return document.getElementById(id);
}

//从后台获取轮播图图片数组
function getSliderImage() {
    imgs = [];
    if (urls.length <= 2) {
        count = 1;
    } else {
        count = urls.length / 2;
        if (count % 2 !== 0) {
            count = Math.ceil(count);
        }
    }
    console.log('轮播图页面数', count);
    for (var i = 0; i < count; i++) {
        var div = document.createElement('div');
        div.className = 'screen';
        div.style.overflow = 'hidden';

        var iframe1 = createIframe();
        var iframe2 = createIframe();

        iframes.push(iframe1);
        iframes.push(iframe2);

        div.appendChild(iframe1);
        div.appendChild(iframe2);

        imgs.push(div);
    }
    return imgs;
}

//创建iframe
function createIframe() {
    var iframe = document.createElement('iframe');
    iframe.width = iframeWidth;
    iframe.height = iframeHeight;
    return iframe;
}

//初始化轮播图
function initSlider() {
    //设置轮播容器宽度
    sliderul = $('sliderul');

    //轮播图页面数组
    var imgs = getSliderImage();

    if (sliderul && imgs) {

        //尾部轮播图加一第一个轮播图副本,实现无缝滚动
        sliderul.style.width = (count + 1) * imgWidth + 'px';

        imgs.forEach(function (img) {
            var li = document.createElement('li');
            li.appendChild(img);
            li.className = "fl";
            sliderul.appendChild(li);
        });
    } else {
        alert('轮播图初始化失败');
        return;
    }

    var sliderarrow = $('sliderarrow');

    //轮播图右下角方块页码
    //initPageBlock(imgs.length);

    var arrows = sliderarrow.getElementsByTagName('span');

    arrows[0].onclick = function () {
        moveLeft();
    };
    arrows[1].onclick = function () {
        moveRight();
    };

    arrows[0].onmouseenter = function () {
        stop();
    }

    arrows[0].onmouseleave = function () {
        go();
    }

    arrows[1].onmouseenter = function () {
        stop();
    }

    arrows[1].onmouseleave = function () {
        go();
    }

    //由于浏览器有请求次数上限，多个iframe会导致卡顿，只好一个个请求
    updateIframe(updateIframeCount);
}

function updateIframe(index) {
    iframes[index].src = urls[index];
    iframes[index].onload = function () {
        updateIframeCount++;
        if (updateIframeCount === urls.length) {

            //在li末尾复制一个和第一个li一样的li，以实现无缝滚动

            var frameBuffer1 = ((sliderul.children)[0]).cloneNode(true);
            sliderul.appendChild(frameBuffer1);
            go();
            return;
        }
        updateIframe(updateIframeCount);
    }
}

function initPageBlock(count) {
    pageul = document.createElement('ul');
    //li宽和左外距
    var w = 30;
    var ml = 5;
    for (var i = 0; i < count; i++) {
        var li = document.createElement('li');
        li.className = "pageli fl";
        li.innerHTML = i + 1 + "";
        li.style.width = w + "px";
        li.style.marginLef = ml + "px";
        if (i === 0) {
            li.style.background = "rgba(1,1,1,1)";
        } else {
            li.style.background = "rgba(1,1,1,0.4)";
        }
        li.index = i;
        //排他滚动
        li.onmouseover = function () {
            index = this.index;
            var target = -this.index * imgWidth;
            changePageColor(this.index);
            moveTo2(sliderul, target);
        };
        pageul.appendChild(li);
        pageul.className = "pageul";
        pageul.style.width = count * (w + ml) + "px";
        pageul.style.visibility = 'hidden';
    }
    var slider = $('slider');
    slider.appendChild(pageul);
}

//匀速移动
function moveTo(obj, target) {
    if (obj) {
        clearInterval(obj.timer);
        obj.timer = setInterval(function () {
            var leader = obj.offsetLeft;
            var step = 10;
            step = leader < target ? step : -step;
            if (Math.abs(target - leader) >= Math.abs(step)) {
                leader = leader + step;
                obj.style.left = leader + "px";
            } else {
                obj.style.left = target + "px";
                clearInterval(obj.timer);
            }
        }, 15);
    }
}

//移动速度逐渐变小
function moveTo2(obj, target, callBack) {
    if (obj) {
        clearInterval(obj.timer);
        obj.timer = setInterval(function () {
            var leader = obj.offsetLeft;
            var step = Math.ceil(Math.abs(leader - target) / 4);
            step = leader < target ? step : -step;

            if (Math.abs(Math.abs(target - leader) - Math.abs(step))>=2) {
                leader = leader + step;
                obj.style.left = leader + "px";
            } else {
                obj.style.left = target + "px";
                clearInterval(obj.timer);
                if (callBack) {
                    callBack();
                }
            }
        }, 24);
    }
}

//多属性移动速度逐渐变小
function moveTo3(obj, json) {
    if (obj) {
        clearInterval(obj.timer);
        obj.timer = setInterval(function () {
            for (var attr in json) {
                var target = json[attr];
                var leader = parseInt(obj.style[attr]) || 0;
                var step = Math.ceil(Math.abs(leader - target) / 10);
                step = leader < target ? step : -step;
                if (Math.abs(target - leader) >= Math.abs(step)) {
                    leader = leader + step;
                    obj.style[attr] = leader + "px";
                } else {
                    obj.style[attr] = target + "px";
                    clearInterval(obj.timer);
                }
            }
        }, 15);
    }
}

function changePageColor(index) {
    return;


    var children = pageul.children;
    for (var i = 0; i < children.length; i++) {
        children[i].style.background = "rgba(1,1,1,0.2)";
    }
    children[index].style.background = "rgba(1,1,1,1)";
}

//轮播图左移动
function moveLeft() {
    //左移
    var target;
    //已第一张，再往左移动则瞬间移到缓冲区，再向做缓动一个屏
    if (index === 0) {
        sliderul.style.left = -(imgs.length) * imgWidth + "px";
        index = imgs.length-1;
        target = -index * imgWidth;
        moveTo2(sliderul, target,function(){

        });
        return;
    }
    index--;//计算出接下来应该显示出来的图片的索引
    //目标 和 pic有关 和 图片宽度 而且是负数
    target = -index * imgWidth;
    moveTo2(sliderul, target);
}

//轮播图右移动
function moveRight() {
    //当前已到最后一页
    if (index === imgs.length - 1) {
        //移动至缓冲屏
        target = -imgs.length * imgWidth;
        moveTo2(sliderul, target, function () {
            index = 0;
            sliderul.style.left = "0";
        });
        return;
    }

    index++;//计算出接下来应该显示出来的图片的索引

    //目标 和 pic有关 和 图片宽度 而且是负数
    var target = -index * imgWidth;
    moveTo2(sliderul, target);
}