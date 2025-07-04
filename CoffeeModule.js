class CoffeeFinder {
    constructor() {
        this.cells = {};
        this.productOfType = {
            ol: new Map(),
            vl: new Map(),
        };
        this.filterData = new Set();

        this.init();

        document.querySelectorAll('.filter_item input').forEach((input) => {
            input.addEventListener('change', (e) => {
                if (e.target.name === 'ico_all') {
                    if (e.target.checked) {
                        document.querySelectorAll('.filter_item input:not([name=ico_all])').forEach((input2) => (input2.checked = false));
                        this.filterData.clear();
                    } else {
                        document.querySelectorAll('.filter_item input:not([name=ico_all])').forEach((input2) => {
                            this.filterData.add(input2.value);
                            input2.checked = true;
                        });
                    }
                } else {
                    if (e.target.checked === true) {
                        this.filterData.add(e.target.value);
                        document.querySelectorAll('[name=ico_all]').forEach((all) => (all.checked = false));
                    } else {
                        this.filterData.delete(e.target.value);
                        if (this.filterData.size === 0) document.querySelectorAll('[name=ico_all]').forEach((all) => (all.checked = true));
                    }
                }

                this.layer.close();
                this.render();
                this.updateComponents().filterTags();
            });
        });

        const cateMenus = document.querySelectorAll('.product_section_category_group .scroll_container button');
        cateMenus.forEach((el) => {
            el.addEventListener('click', (e) => {
                cateMenus.forEach((el2) => el2.classList.remove('active'));
                e.target.closest('button').classList.add('active');

                document
                    .querySelector('.product_section_body.mo_only .product_section_category_item_list')
                    .setAttribute('name', e.target.closest('button').getAttribute('name'));

                this.renderPrd();
            });
        });
    }

    async init() {
        await this.getData();
        this.setComponents().cellItems(Object.values(this.coffeeData).flat());
        this.setComponents().layerEl(Object.values(this.coffeeData).flat());

        this.setType('vl');

        this.layer = this.setComponents().areaLayer();
        this.setComponents().areaCell();
        this.setComponents().mobileFilterTags();
        this.setComponents().pcSwiper();

        this.render();
    }

    async getData() {
        this.coffeeData = coffeeDataDev;;
        if (!window.napi) this.setStarbucksData(Object.values(this.coffeeData).flat());
        else {
            await Promise.all(
                this.coffeeData.ol.map(async (cur) => {
                    const result = await window.napi.catalog().getProduct(cur.sku);
                    cur.headline = result.headline;
                    cur.icon = result.images.foreground;
                    cur.category = result.category;
                    cur.capsuleProductAromatics = result.capsuleProductAromatics;
                    cur.inStock = result.inStock;
                    cur.price = result.price;
                    cur.salesMultiple = result.salesMultiple;
                    return cur;
                }),
                this.coffeeData.vl.map(async (cur) => {
                    const result = await window.napi.catalog().getProduct(cur.sku);
                    cur.headline = result.headline;
                    cur.icon = result.images.foreground;
                    cur.category = result.category;
                    cur.capsuleProductAromatics = result.capsuleProductAromatics;
                    cur.inStock = result.inStock;
                    cur.price = result.price;
                    cur.salesMultiple = result.salesMultiple;
                    return cur;
                })
            );

            this.setStarbucksData(Object.values(this.originData).flat());
        }
    }

    setStarbucksData(data) {
        data.forEach((coffee) => (coffee.name = coffee.name.replace('스타벅스®', '<span style="color:#0d6243;">스타벅스<sup>®</sup></span><br>')));
    }

    setComponents() {
        return {
            areaCell: () => {
                const setEl = () => {
                    this.cells.topLeft = document.querySelectorAll('.content .area .top_left button');
                    this.cells.topRight = document.querySelectorAll('.content .area .top_right button');
                    this.cells.bottomRight = document.querySelectorAll('.content .area .bottom_right button');
                    this.cells.bottomLeft = document.querySelectorAll('.content .area .bottom_left button');
                };

                const setAreaGridPosition = () => {
                    this.setGridPosition(this.cells.topLeft, -5, -1, -5, -1);
                    this.setGridPosition(this.cells.topRight, -5, -1, 1, 5);
                    this.setGridPosition(this.cells.bottomRight, 1, 5, 1, 5);
                    this.setGridPosition(this.cells.bottomLeft, 1, 5, -5, -1);
                };

                const cellEvent = ({ target }) => {
                    const cell = target.closest('button');
                    if (!cell) return;
                    if (cell.querySelector('.capsule').dataset.sku) {
                        const sku = cell.querySelector('.capsule').dataset.sku;
                        const result = this.data.find((el) => el.sku === sku);

                        this.layer.set(result, cell);
                    }
                };

                setEl();
                setAreaGridPosition();

                Object.values(this.cells)
                    .map((el) => Array.from(el))
                    .flat()
                    .forEach((cell) => cell.addEventListener('click', cellEvent));
            },
            areaLayer: () => {
                this.areaLayer = document.querySelector('.product_bubble');
                return {
                    set: (data, target) => {
                        this.areaLayer.classList.remove('hide');
                        this.areaLayer.innerHTML = '';
                        this.areaLayer.append(...data.layerEl);

                        const keyBody = document.querySelector('.key_body');
                        const bodyOffsetX = keyBody.getBoundingClientRect().left + window.pageXOffset;
                        const bodyOffsetY = keyBody.getBoundingClientRect().top + window.pageYOffset;

                        const { top, left, width } = target.getBoundingClientRect();
                        const layerRect = this.areaLayer.getBoundingClientRect();
                        this.areaLayer.style.top = `${top + window.pageYOffset - bodyOffsetY - layerRect.height}px`;
                        this.areaLayer.style.left = `${left + window.pageXOffset - bodyOffsetX + width / 2 - layerRect.width / 2}px`;
                    },
                    close: () => {
                        this.areaLayer.classList.add('hide');
                    },
                };
            },
            cellItems: (data) => {
                data.forEach((cellData) => {
                    const cell = document.createElement('div');
                    cell.classList.add('capsule');
                    cell.dataset.sku = cellData.sku;
                    const capsuleImage = document.createElement('img');
                    capsuleImage.setAttribute('src', `https://www.nespresso.com${cellData.icon || ''}`);

                    const capsuleInfo = document.createElement('div');
                    capsuleInfo.classList.add('info');

                    const capsuleNmae = document.createElement('p');
                    capsuleNmae.innerHTML = cellData.name;

                    capsuleInfo.append(capsuleNmae);

                    cell.append(capsuleImage);

                    cellData.el = [cell, capsuleInfo];
                });
            },
            productItem: (data) => {
                const thumbnail = document.createElement('div');
                thumbnail.classList.add('thumbnail');
                const image = document.createElement('img');
                image.src = `https://www.nespresso.com${data.icon}`;
                thumbnail.append(image);

                const info = document.createElement('div');
                info.classList.add('info');
                const title = document.createElement('div');
                title.classList.add('item_title');
                const desc = document.createElement('div');
                desc.classList.add('item_desc');
                const buttonwrap = document.createElement('div');
                buttonwrap.classList.add('item_button_wrap');

                title.innerHTML = data.name;
                desc.innerHTML = `
                      <p>${data.capsuleProductAromatics.join(' ,')}</p>
                      <p>${data.headline}</p>
                    `;

                const price = document.createElement('div');

                price.classList.add('item_price');

                buttonwrap.append(price);

                const itemHandle = document.createElement('div');
                itemHandle.classList.add('item_handle');

                const itemCntHandle = document.createElement('div');
                itemCntHandle.classList.add('item_cnt_handle');

                const minusButton = document.createElement('button');
                minusButton.classList.add('minus_button');
                const count = document.createElement('p');
                count.dataset.value = 1;
                const plusButton = document.createElement('button');
                plusButton.classList.add('plus_button');

                plusButton.addEventListener('click', () => {
                    count.dataset.value = +count.dataset.value + 1;
                    renderCount();
                });

                minusButton.addEventListener('click', () => {
                    count.dataset.value = +count.dataset.value - 1;
                    if (+count.dataset.value <= 0) count.dataset.value = 1;
                    renderCount();
                });

                const renderCount = () => {
                    price.textContent = `₩ ${(data.price * data.salesMultiple * +count.dataset.value).toLocaleString()}`;
                    count.textContent = `${+count.dataset.value} (${+count.dataset.value * data.salesMultiple})`;
                };

                renderCount();

                itemCntHandle.append(minusButton, count, plusButton);

                const itemCartButton = document.createElement('div');
                itemCartButton.classList.add('item_cart_button');

                itemHandle.append(itemCntHandle, itemCartButton);

                buttonwrap.append(price, itemHandle);

                info.append(title, desc, buttonwrap);

                return [thumbnail, info];
            },
            layerEl: (data) => {
                data.forEach((cellData) => {
                    const thumbnail = document.createElement('div');
                    thumbnail.classList.add('thumbnail');
                    const img = document.createElement('img');
                    img.setAttribute('src', `https://www.nespresso.com${cellData.icon}`);

                    thumbnail.append(img);

                    const info = document.createElement('div');
                    info.classList.add('info');

                    const title = document.createElement('div');
                    title.classList.add('product_bubble_title');
                    title.innerHTML = cellData.name;

                    const desc = document.createElement('div');
                    desc.classList.add('product_bubble_desc');

                    const p1 = document.createElement('p');
                    const p2 = document.createElement('p');

                    p1.textContent = cellData.capsuleProductAromatics.join(' ,');
                    p2.innerHTML = cellData.headline + `<br>` + cellData.category;

                    desc.append(p1, p2);

                    const productLayerControl = document.createElement('div');
                    productLayerControl.classList.add('product_bubble_control');
                    const price = document.createElement('p');
                    price.classList.add('price');
                    price.dataset.value = 1;
                    price.textContent = `₩ ${(+price.dataset.value * cellData.price * cellData.salesMultiple).toLocaleString()}`;

                    const counter = document.createElement('div');
                    counter.classList.add('counter');

                    const buttonMinus = document.createElement('button');
                    const count = document.createElement('p');
                    const buttonPlus = document.createElement('button');

                    buttonMinus.addEventListener('click', () => {
                        price.dataset.value = +price.dataset.value - 1;
                        if (+price.dataset.value < 0) price.dataset.value = 1;
                        price.textContent = `₩ ${(+price.dataset.value * cellData.price * cellData.salesMultiple).toLocaleString()}`;
                        count.textContent = `${+price.dataset.value} (${+price.dataset.value * cellData.salesMultiple})`;
                    });
                    buttonPlus.addEventListener('click', () => {
                        price.dataset.value = +price.dataset.value + 1;
                        price.textContent = `₩ ${(+price.dataset.value * cellData.price * cellData.salesMultiple).toLocaleString()}`;
                        count.textContent = `${+price.dataset.value} (${+price.dataset.value * cellData.salesMultiple})`;
                    });

                    buttonMinus.classList.add('btn_minus');
                    count.textContent = `${+price.dataset.value} (${+price.dataset.value * cellData.salesMultiple})`;
                    buttonPlus.classList.add('btn_plus');

                    counter.append(buttonMinus, count, buttonPlus);

                    const addCart = document.createElement('button');
                    addCart.classList.add('add_cart');

                    productLayerControl.append(price, counter, addCart);

                    info.append(title, desc, productLayerControl);

                    const layerCloseButton = document.createElement('button');
                    layerCloseButton.classList.add('product_bubble_close');
                    layerCloseButton.addEventListener('click', () => {
                        this.layer.close();
                    });

                    cellData.layerEl = [thumbnail, info, layerCloseButton];
                });
            },
            mobileFilterTags: () => {
                this.filterTags = new Map();
                this.tagArea = document.querySelector('.tags');

                filterList.forEach((filter) => {
                    const tagsButton = document.createElement('button');
                    tagsButton.style.backgroundColor = filter.color;
                    const tagsSpan = document.createElement('span');
                    tagsSpan.textContent = `#${filter.name}`;

                    tagsButton.append(tagsSpan);
                    this.filterTags.set(filter.filterKey, tagsButton);
                });
            },
            pcSwiper: () => {
                const pcSwiperConfig = (area) => {
                    return {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                        spaceBetween: 0,
                        navigation: {
                            prevEl: `.product_section_body.pc_only .product_section_category[name=${area}] .button-prev`,
                            nextEl: `.product_section_body.pc_only .product_section_category[name=${area}] .button-next`,
                        },
                        breakpoints: {
                            768: {
                                slidesPerView: 1,
                                spaceBetween: 25,
                            },
                            1280: {
                                slidesPerView: 2,
                                spaceBetween: 25,
                            },
                            1540: {
                                slidesPerView: 3,
                                spaceBetween: 25,
                            },
                        },
                    };
                };

                const pcArticles = document.querySelectorAll('.product_section_body.pc_only .product_section_category');
                pcArticles.forEach((el) => {
                    const areaName = el.getAttribute('name');
                    el.querySelector('.swiper-wrapper').innerHTML = '';
                    let filterdData = [];
                    switch (areaName) {
                        case 'top_right':
                            filterdData = this.data.filter((cf) => cf.properties[0] > 0 && cf.properties[1] < 0);
                            break;
                        case 'bottom_left':
                            filterdData = this.data.filter((cf) => cf.properties[0] < 0 && cf.properties[1] > 0);
                            break;
                        case 'bottom_right':
                            filterdData = this.data.filter((cf) => cf.properties[0] > 0 && cf.properties[1] > 0);
                            break;
                        case 'top_left':
                            filterdData = this.data.filter((cf) => cf.properties[0] < 0 && cf.properties[1] < 0);
                            break;
                        case 'decaf':
                            filterdData = this.data.filter((cf) => filterList.find((filter) => filter.filterKey === 'decaf').items.includes(cf.sku));
                            break;
                    }
                    filterdData.forEach((data) => {
                        const swiperItem = document.createElement('li');
                        swiperItem.classList.add('swiper-slide');
                        swiperItem.append(...this.setComponents().productItem(data));
                        el.querySelector('.swiper-wrapper').append(swiperItem);
                    });

                    new Swiper(`.product_section_body.pc_only .product_section_category[name=${areaName}] .swiper`, pcSwiperConfig(areaName));
                });
            },
        };
    }

    updateComponents() {
        return {
            filterTags: () => {
                if (this.filterData.size === 0) {
                    this.tagArea.setAttribute('style', 'display: none !important;');
                } else {
                    this.tagArea.removeAttribute('style');
                    this.tagArea.innerHTML = '';
                    Array.from(this.filterData).forEach((key) => {
                        this.tagArea.append(this.filterTags.get(key));
                    });
                }
            },
        };
    }

    setType(type) {
        this.type = type;
        this.data = this.coffeeData[this.type];

        this.layer?.close();
        this.resetContent();
        this.render();
        this.renderPrd();
    }

    changeTitle(area) {
        const title = document.querySelector('.key_section_header h2');

        switch (area) {
            case 'top_right':
                title.innerHTML = `당신은 <span style="color:#cf9349;">부드럽고</span> <span style="color:#fb7d4f;">산뜻한</span> 커피를<br> 좋아하는 <strong>"아침햇살 수집가"</strong>  입니다.`;
                break;
            case 'bottom_right':
                title.innerHTML = `당신은 <span style="color: #6f4534;">강렬하고</span> <span style="color:#fb7d4f;">산뜻한</span> 커피를<br> 좋아하는 <strong>"호기심 많은 탐험가"</strong> 입니다.`;
                break;
            case 'top_left':
                title.innerHTML = `당신은 <span style="color:#cf9349;">부드럽고</span> <span style="color: #e9b444;">고소한</span> 커피를<br> 좋아하는 <strong>"포근한 기억 수집가"</strong> 입니다.`;
                break;
            case 'bottom_left':
                title.innerHTML = ` 당신은 <span style="color: #6f4534;">강렬하고</span> <span style="color: #e9b444;">고소한</span> 커피를<br> 좋아하는 <strong>"깊은 밤의 철학자"</strong> 입니다.`;
                break;
            default:
                title.innerHTML = '커피 취향 탐색하기';
                break;
        }
    }

    selectContent(e) {
        this.selectedContentArea = e.target.classList[0];

        this.changeTitle(e.target.classList[0]);

        document.querySelector('.content').classList.add(this.selectedContentArea);
    }

    moveArea(e) {
        this.layer.close();
        const direction = e.target.closest('button').classList[1];
        switch (direction) {
            case 'top':
                document.querySelector('.content').classList.replace('bottom_right', 'top_right');
                document.querySelector('.content').classList.replace('bottom_left', 'top_left');
                break;
            case 'right':
                document.querySelector('.content').classList.replace('top_left', 'top_right');
                document.querySelector('.content').classList.replace('bottom_left', 'bottom_right');
                break;
            case 'bottom':
                document.querySelector('.content').classList.replace('top_right', 'bottom_right');
                document.querySelector('.content').classList.replace('top_left', 'bottom_left');
                break;
            case 'left':
                document.querySelector('.content').classList.replace('top_right', 'top_left');
                document.querySelector('.content').classList.replace('bottom_right', 'bottom_left');
                break;
            case 'right-top':
                document.querySelector('.content').setAttribute('class', 'content top_right');
                break;
            case 'right-bottom':
                document.querySelector('.content').setAttribute('class', 'content bottom_right');
                break;
            case 'left-bottom':
                document.querySelector('.content').setAttribute('class', 'content bottom_left');
                break;
            case 'left-top':
                document.querySelector('.content').setAttribute('class', 'content top_left');
                break;
            default:
                null;
        }

        this.changeTitle(document.querySelector('.content').classList[1]);
    }

    openFilter() {
        document.querySelector('.key_body .filter').classList.toggle('fold');
    }

    resetContent() {
        document.querySelector('.content').classList.remove('top_left');
        document.querySelector('.content').classList.remove('top_right');
        document.querySelector('.content').classList.remove('bottom_right');
        document.querySelector('.content').classList.remove('bottom_left');

        this.changeTitle();
    }

    setGridPosition(target, x1, y1, x2, y2) {
        let num = 0;
        for (let i = x1; i <= y1; i++) {
            for (let j = x2; j <= y2; j++) {
                target[num].dataset.pos_x = j;
                target[num].dataset.pos_y = i;
                num++;
            }
        }
    }

    getCell(x, y) {
        return document.querySelector(`.content .area button[data-pos_x='${x}'][data-pos_y='${y}']`);
    }

    resetGrid() {
        return document.querySelectorAll(`.content .area button`).forEach((el) => (el.innerHTML = ''));
    }

    createMoItem(data3) {
        const result3 = data3.map((data) => {
            const result = document.createElement('li');
            result.classList.add('swiper-slide');
            const thumbnail = document.createElement('div');
            thumbnail.classList.add('thumbnail');
            const image = document.createElement('img');
            image.src = `https://www.nespresso.com${data.icon}`;
            thumbnail.append(image);

            const info = document.createElement('div');
            info.classList.add('info');
            const title = document.createElement('div');
            title.classList.add('item_title');
            const desc = document.createElement('div');
            desc.classList.add('item_desc');
            const buttonwrap = document.createElement('div');
            buttonwrap.classList.add('item_button_wrap');

            title.innerHTML = data.name;
            desc.innerHTML = `
        <p>${data.capsuleProductAromatics.join(' ,')}</p>
        <p>${data.headline}</p>
        `;

            const price = document.createElement('div');

            price.classList.add('item_price');

            buttonwrap.append(price);

            const itemHandle = document.createElement('div');
            itemHandle.classList.add('item_handle');

            const itemCntHandle = document.createElement('div');
            itemCntHandle.classList.add('item_cnt_handle');

            const minusButton = document.createElement('button');
            minusButton.classList.add('minus_button');
            const count = document.createElement('p');
            const plusButton = document.createElement('button');
            plusButton.classList.add('plus_button');

            plusButton.addEventListener('click', () => {
                count.setAttribute('value', +count.getAttribute('value') + 1);
                renderCount();
            });

            count.setAttribute('value', 1);

            const renderCount = () => {
                price.textContent = `₩ ${(data.price * data.salesMultiple * +count.getAttribute('value')).toLocaleString()}`;
                count.textContent = `${+count.getAttribute('value')} (${+count.getAttribute('value') * data.salesMultiple})`;
            };

            renderCount();

            itemCntHandle.append(minusButton, count, plusButton);

            const itemCartButton = document.createElement('div');
            itemCartButton.classList.add('item_cart_button');

            itemHandle.append(itemCntHandle, itemCartButton);

            buttonwrap.append(price, itemHandle);

            info.append(title, desc, buttonwrap);
            result.append(thumbnail, info);

            return result;
        });

        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        const ul = document.createElement('ul');

        ul.append(...result3);

        slide.append(ul);

        return slide;
    }

    render() {
        this.resetGrid();
        this.data
            .filter((coffee) => {
                if (this.filterData.size === 0) return true;
                else {
                    const filteredData = filterList.filter((filter2) => Array.from(this.filterData).includes(filter2.filterKey));
                    return filteredData.some((el) => el.items.includes(coffee.sku));
                }
            })
            .filter((coffee) => {
                if (this.filterData.size === 0) {
                    return !filterList.find((el) => el.filterKey === 'decaf').items.includes(coffee.sku);
                } else {
                    return true;
                }
            })
            .forEach((coffee) => {
                if (coffee.properties.length !== 2) return;
                const [x, y] = coffee.properties;
                const target = this.getCell(x, y);
                if (!target) return;
                target.innerHTML = ``;
                target.append(...coffee.el);
            });
    }

    renderPrd() {
        const moArticles = document.querySelectorAll('.product_section_body.mo_only .product_section_category_item_list');

        moArticles.forEach((el) => {
            el.querySelector('.swiper-wrapper').innerHTML = '';
            let chunked = [];
            let data = this.data;

            switch (el.getAttribute('name')) {
                case 'all':
                    chunked = [];
                    data = this.data;

                    for (let i = 0; i < data.length; i += 3) {
                        chunked.push(data.slice(i, i + 3));
                    }

                    chunked.forEach((cf) => {
                        el.querySelector('.swiper-wrapper').append(this.createMoItem(cf));
                    });

                    break;
                case 'top_right':
                    chunked = [];
                    data = this.data.filter((cf) => {
                        return cf.properties[0] > 0 && cf.properties[1] < 0;
                    });

                    for (let i = 0; i < data.length; i += 3) {
                        chunked.push(data.slice(i, i + 3));
                    }

                    chunked.forEach((cf) => {
                        el.querySelector('.swiper-wrapper').append(this.createMoItem(cf));
                    });

                    break;
                case 'bottom_left':
                    chunked = [];
                    data = this.data.filter((cf) => {
                        return cf.properties[0] < 0 && cf.properties[1] > 0;
                    });

                    for (let i = 0; i < data.length; i += 3) {
                        chunked.push(data.slice(i, i + 3));
                    }

                    chunked.forEach((cf) => {
                        el.querySelector('.swiper-wrapper').append(this.createMoItem(cf));
                    });

                    break;
                case 'bottom_right':
                    chunked = [];
                    data = this.data.filter((cf) => {
                        return cf.properties[0] > 0 && cf.properties[1] > 0;
                    });

                    for (let i = 0; i < data.length; i += 3) {
                        chunked.push(data.slice(i, i + 3));
                    }

                    chunked.forEach((cf) => {
                        el.querySelector('.swiper-wrapper').append(this.createMoItem(cf));
                    });

                    break;
                case 'top_left':
                    chunked = [];
                    data = this.data.filter((cf) => {
                        return cf.properties[0] < 0 && cf.properties[1] < 0;
                    });

                    for (let i = 0; i < data.length; i += 3) {
                        chunked.push(data.slice(i, i + 3));
                    }

                    chunked.forEach((cf) => {
                        el.querySelector('.swiper-wrapper').append(this.createMoItem(cf));
                    });

                    break;
                case 'decaf':
                    chunked = [];
                    data = this.data.filter((cf) => {
                        return filterList.find((filter) => filter.filterKey === 'decaf').items.includes(cf.sku);
                    });

                    for (let i = 0; i < data.length; i += 3) {
                        chunked.push(data.slice(i, i + 3));
                    }

                    chunked.forEach((cf) => {
                        el.querySelector('.swiper-wrapper').append(this.createMoItem(cf));
                    });

                    break;
            }

            if (!this.mobileSwiper) {
                this.mobileSwiper = new Swiper('.product_section_body.mo_only  .swiper', {
                    slidesPerView: 1,
                    slidesPerGroup: 1,
                    spaceBetween: 20,
                    pagination: {
                        el: '.swiper-pagination',
                    },
                });
            } else {
                this.mobileSwiper.slideTo(0);
                this.mobileSwiper.update();
            }
        });
    }
}
