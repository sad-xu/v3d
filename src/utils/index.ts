/**
 * 根据宽度设置根字体大小
 * 1920 100
 * 576 50
 * */
export const flexible = () => {
  const t = window.document;
  const n = t.documentElement;
  let r = 0,
    s = 0;
  function a() {
    const e = window.innerWidth;
    s = 0.0372 * e + 28.576;
    n.style.fontSize = s + 'px';
  }
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(r), (r = window.setTimeout(a, 16));
    },
    !1
  ),
    (t.body.style.fontSize = 16 + 'px'),
    a();
};

export default null;
