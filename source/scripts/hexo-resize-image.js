function set_image_size(image, width, height) {
  image.setAttribute('width', width + 'px');
  if (height) {
    image.setAttribute('height', height + 'px');
  }
}

function hexo_resize_image() {
  if (isMobile()) {
    return;
  }
  const imgs = document.getElementsByTagName('img');
  for (let i = imgs.length - 1; i >= 0; i--) {
    const img = imgs[i];
    const src = img.getAttribute('src').toString();
    let fields = src.match(/(?<=\?)\d*x\d*/g);
    if (fields && fields.length == 1) {
      const values = fields[0].split('x');
      if (values.length == 2) {
        let width = values[0];
        let height = values[1];
        const n_width = img.naturalWidth;
        const n_height = img.naturalHeight;
        if (width.length && height.length) {
          height = (n_height * width) / n_width;
          width = (n_width * height) / n_height;
        }
        set_image_size(img, width, height);
      }
      continue;
    }

    fields = src.match(/(?<=\?)\d*/g);
    if (fields && fields.length == 1) {
      const scale = parseFloat(fields[0].toString());
      const width = (scale / 100.0) * img.naturalWidth;
      const height = (scale / 100.0) * img.naturalHeight;
      set_image_size(img, width, height);
    }
  }
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
window.onload = hexo_resize_image;
