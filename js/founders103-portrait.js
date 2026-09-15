/* Build 103: isolated About hero portrait swap.
 * Reuse the original PNG with uniform scaling and text-safe clipping only.
 * No face generation, color filters, image-file edits or changes to other sections.
 * Keep the original hero visible if either source asset cannot be decoded.
 */
(async () => {
  'use strict';
  const media = document.querySelector('.founders-page-build69 .founders-hero-exact-media');
  if (!media || media.dataset.founders103 === 'ready') return;
  const old = media.querySelector('img');
  if (!old || !old.getAttribute('src').endsWith('assets/images/about-our-founders-hero-approved.png')) return;
  try {
    const photo = new Image();
    photo.src = 'assets/images/justyn-elle-professional-approved-102.png';
    await Promise.all([photo.decode(), old.decode()]);
    if (photo.naturalWidth !== 1348 || photo.naturalHeight !== 1254) return;
    const style = document.createElement('style');
    style.id = 'founders103-portrait-style';
    style.textContent = `/* About hero only. Existing size, crop and click target are retained. */
.founders-page-build69 .founders-hero-exact{--ra-founders-portrait:103;}
.founders-page-build69 .founders-hero-exact-media .founders103-scene{
  position:absolute;inset:0;display:block;width:100%;height:100%;
  max-width:none;pointer-events:none;
}
@media(max-width:980px){
  .founders-page-build69 .founders-hero-exact-media .founders103-scene{
    width:222.10414453%;left:-48.841657812%;right:auto;
  }
}
@media(max-width:640px){
  .founders-page-build69 .founders-hero-exact-media .founders103-scene{
    width:244.31455898%;left:-56.282678002%;right:auto;
  }
}
`;
    const template = document.createElement('template');
    template.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="founders103-scene" aria-hidden="true" focusable="false" viewBox="0 0 1672 941">
<defs>
 <linearGradient id="f103-cream" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fcf8ef"/><stop offset="1" stop-color="#fffaf0"/></linearGradient>
 <clipPath id="f103-restore"><path d="M965 190 C960 130 995 92 1040 91 C1100 80 1137 115 1135 163 C1146 190 1151 247 1135 273 L1126 330 L1230 383 C1210 362 1204 317 1210 265 C1208 213 1248 160 1302 159 C1360 143 1403 174 1422 224 L1435 308 L1432 371 C1485 391 1518 413 1526 452 L1542 527 L1525 544 L1529 645 L1553 942 L881 945 L848 868 L818 739 L803 630 L786 627 L808 500 C818 447 841 421 882 397 L984 343 L982 297 C970 266 954 226 965 190 Z"/></clipPath>
 <clipPath id="f103-outline"><path d="M350 93 L350 95 L342 101 L335 114 L322 126 L312 148 L311 158 L309 161 L309 175 L306 185 L306 194 L310 218 L312 249 L315 258 L315 264 L306 265 L303 267 L301 272 L301 289 L306 301 L313 311 L324 334 L332 342 L343 343 L360 369 L366 397 L359 398 L345 414 L342 415 L342 418 L336 425 L332 427 L331 431 L327 433 L325 437 L315 447 L313 447 L307 455 L295 459 L294 462 L287 466 L283 466 L279 471 L274 474 L270 474 L267 478 L262 481 L258 481 L257 484 L253 484 L251 487 L182 526 L154 536 L137 545 L131 550 L124 552 L109 566 L101 580 L93 603 L91 621 L85 647 L85 664 L78 674 L72 690 L72 713 L70 714 L70 717 L65 723 L61 732 L61 751 L66 764 L56 782 L55 804 L51 818 L50 830 L43 854 L42 872 L38 893 L35 925 L33 966 L34 993 L30 1005 L29 1044 L30 1051 L39 1076 L55 1111 L62 1130 L70 1146 L81 1163 L96 1202 L112 1228 L123 1253 L1256 1253 L1256 1250 L1251 1242 L1250 1232 L1237 1201 L1236 1193 L1230 1181 L1227 1168 L1250 1168 L1255 1166 L1270 1148 L1272 1142 L1292 1109 L1295 1102 L1295 1092 L1291 1083 L1293 1079 L1312 1058 L1316 1050 L1316 1036 L1318 1027 L1325 1016 L1327 1006 L1327 995 L1318 984 L1325 978 L1329 972 L1329 958 L1322 950 L1322 943 L1316 916 L1306 893 L1300 885 L1297 875 L1295 819 L1287 788 L1284 751 L1280 739 L1280 728 L1275 710 L1269 700 L1268 690 L1264 678 L1263 654 L1256 635 L1251 628 L1252 592 L1248 572 L1242 558 L1235 552 L1229 550 L1210 551 L1195 548 L1183 548 L1170 544 L1130 542 L1122 539 L1110 531 L1102 523 L1102 520 L1095 512 L1073 497 L1065 489 L1064 486 L1058 482 L1051 474 L1049 470 L1049 463 L1047 457 L1046 440 L1057 420 L1059 410 L1061 407 L1061 394 L1063 383 L1069 371 L1069 353 L1067 336 L1054 297 L1054 291 L1048 274 L1047 265 L1040 249 L1037 237 L1030 223 L1027 213 L1024 210 L1020 200 L1014 191 L1014 187 L1004 170 L993 157 L984 150 L979 143 L973 139 L970 139 L969 136 L960 131 L957 131 L952 128 L931 124 L917 124 L912 126 L900 136 L894 136 L873 141 L865 146 L856 148 L826 168 L811 182 L801 194 L794 208 L791 211 L782 235 L782 245 L779 250 L776 263 L765 289 L759 293 L755 298 L756 317 L765 338 L763 358 L762 401 L767 421 L767 429 L763 439 L762 480 L767 509 L761 525 L756 530 L753 537 L747 542 L747 545 L744 549 L741 533 L733 516 L725 504 L710 491 L703 488 L694 487 L676 478 L638 467 L599 450 L579 443 L562 435 L554 426 L551 425 L542 360 L550 341 L555 322 L556 312 L564 301 L565 280 L563 269 L567 256 L567 230 L563 226 L551 225 L536 154 L526 137 L524 130 L515 121 L512 114 L502 108 L497 103 L495 103 L490 97 L476 90 L474 86 L472 86 L468 82 L460 80 L455 77 L438 76 L434 73 L415 71 L393 71 L390 75 L378 77 Z"/></clipPath>
 <clipPath id="f103-woman"><path d="M760 0 L1348 0 L1348 1254 L683 1254 C695 1130 730 965 705 823 C674 716 680 651 684 591 C681 560 685 545 713 529 C741 519 765 498 773 467 C765 413 752 360 760 0 Z"/></clipPath>
 <clipPath id="f103-man"><rect width="780" height="1254"/></clipPath>
</defs>
<image xlink:href="assets/images/about-our-founders-hero-approved.png" width="1672" height="941"/>
<path d="M965 190 C960 130 995 92 1040 91 C1100 80 1137 115 1135 163 C1146 190 1151 247 1135 273 L1126 330 L1230 383 C1210 362 1204 317 1210 265 C1208 213 1248 160 1302 159 C1360 143 1403 174 1422 224 L1435 308 L1432 371 C1485 391 1518 413 1526 452 L1542 527 L1525 544 L1529 645 L1553 942 L881 945 L848 868 L818 739 L803 630 L786 627 L808 500 C818 447 841 421 882 397 L984 343 L982 297 C970 266 954 226 965 190 Z" fill="url(#f103-cream)" stroke="url(#f103-cream)" stroke-width="7"/>
<g clip-path="url(#f103-restore)" fill="none" stroke="#c9983c" stroke-width="1.25"><circle cx="1329.6" cy="474" r="373.0"/><circle cx="1339.4" cy="467.1" r="320.3"/><circle cx="1346.5" cy="505.5" r="316.9"/></g>
<g transform="translate(725 63.2) scale(.7)" clip-path="url(#f103-man)"><g clip-path="url(#f103-outline)"><image class="founders103-original-photo" xlink:href="assets/images/justyn-elle-professional-approved-102.png" width="1348" height="1254"/></g></g>
<g transform="translate(602 63.2) scale(.7)" clip-path="url(#f103-woman)"><g clip-path="url(#f103-outline)"><image class="founders103-original-photo" xlink:href="assets/images/justyn-elle-professional-approved-102.png" width="1348" height="1254"/></g></g>
</svg>`;
    const scene = template.content.firstElementChild;
    document.head.appendChild(style);
    old.replaceWith(scene);
    media.dataset.founders103 = 'ready';
  } catch (error) {
    console.warn('About portrait could not load; the original hero remains visible.', error);
  }
})();
