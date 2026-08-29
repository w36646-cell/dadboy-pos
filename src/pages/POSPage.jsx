import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import {

  createPortal,

} from "react-dom";

import ProductCard from "../components/pos/ProductCard";

import CartPanel from "../components/pos/CartPanel";

import PackPopup from "../components/pos/PackPopup";

import ProductOptionPopup from "../components/pos/ProductOptionPopup";

import "../styles/POSModern.css";
import "../styles/POSPolish.css";

function POSPage({

  products,

  inventory,

  cart,

  todaySoldQty,

  todaySalesAmount,
 
  onAddToCart,

  onChangeCartQty,

  onIncreaseQty,

  onDecreaseQty,

  onRemoveItem,

  onOpenPayment,

  isOnline,

  cloudReady,

  pendingSaleCount,

  pendingStockCount,

}) {

  const [

    searchText,

    setSearchText,

  ] = useState("");

  const [

    searchOpen,

    setSearchOpen,

  ] = useState(false);

  const [

    searchPortalTarget,

    setSearchPortalTarget,

  ] = useState(null);

  const [

    selectedProduct,

    setSelectedProduct,

  ] = useState(null);

  const [

    selectedOption,

    setSelectedOption,

  ] = useState(null);

 const [

    popupQty,

    setPopupQty,

  ] = useState(1);

  const [

    popupSpecialMode,

    setPopupSpecialMode,

  ] = useState("normal");

  const [

    packProduct,
 
    setPackProduct,

  ] = useState(null);

  const [

    packPopupQty,

    setPackPopupQty,

  ] = useState(1);

  const [

    packSpecialMode,

    setPackSpecialMode,

  ] = useState("normal");

  const [cartPulse, setCartPulse] = useState(false);
 
  const searchInputRef =

    useRef(null);

  const holdTimerRef =

    useRef(null);

  const longPressTriggeredRef =

    useRef(false);

  const sourceRectRef = useRef(null);

  const LONG_PRESS_MS =

    550;

  /*

    เอา Search ไปต่อท้าย

    ปุ่มโหมดเจ้าของร้าน

    โดยไม่ต้องแก้ App.jsx

  */

  useEffect(() => {

    function findTarget() {

     const target =

  document.querySelector(

    "#owner-sidebar-search-slot"

  ) ||

  document.querySelector(

    ".employee-pos-topbar > div"

  );

      setSearchPortalTarget(target);
 
 
    }

    findTarget();

    const timer =

      setTimeout(

        findTarget,

        100

      );

    return () =>

      clearTimeout(

        timer

      );

  }, []);

  useEffect(() => {

    if (

      searchOpen &&

      searchInputRef.current

    ) {

      searchInputRef.current.focus({

  preventScroll: true,

});
 
    }

  }, [

    searchOpen,

  ]);

  const filteredProducts =

    useMemo(() => {

      const keyword =

        searchText

          .trim()

          .toLowerCase();

     if (!keyword) {

  return products.filter(

    (product) =>

      product.isActive !== false

  );

}

     return products.filter(

  (product) =>

    product.isActive !== false &&

    String(

      product.name || ""

    )

      .toLowerCase()

      .includes(

        keyword

      )

);

    }, [

      products,

      searchText,

    ]);

  const totalQty =

    cart.reduce(

      (sum, item) =>

        sum +

        Number(

          item.qty || 0

        ),

      0

    );

  const total =

    cart.reduce(

      (sum, item) =>

        sum +

        Number(

          item.price || 0

        ) *

          Number(

            item.qty || 0

          ),

      0

    );

  function getStock(

    productId

  ) {

    return Number(

      inventory[

        productId

      ] ?? 50

    );

  }

  function isLowStock(

    product,

    stock

  ) {

    const trackStock =

      product.trackStock !==

      false;

    if (!trackStock) {

      return false;

    }

    const minStock =

      Number(

        product.minStock ??

          5

      );

    return (

      stock <= minStock

    );

  }

  function hasPack(

    product

  ) {

    return (

      product.packEnabled ===

        true &&

      Number(

        product.packQty || 0

      ) >= 2 &&

      Number(

        product.packPrice ||

          0

      ) > 0

    );

  }


  function rememberSource(event) {

    const card = event?.currentTarget;

    const image =

      card?.querySelector?.(".pos-card-image");

    sourceRectRef.current =

      (image || card)?.getBoundingClientRect?.() || null;

  }

  function flyToCart(product) {

    const start = sourceRectRef.current;

    const target =

      document.querySelector(".pos-header-total");

    if (!start || !target) {

      setCartPulse(true);

      setTimeout(() => {

        setCartPulse(false);

      }, 420);

      return;

    }

    const end =

      target.getBoundingClientRect();

    const flyer =

      document.createElement("div");

    flyer.className =

      "pos-fly-to-cart";

    if (product?.image) {

      const img =

        document.createElement("img");

      img.src = product.image;

      img.alt = "";

      flyer.appendChild(img);

    } else {

      flyer.textContent = "+1";

    }

    const startCenterX =

      start.left + start.width / 2;

    const startCenterY =

      start.top + start.height / 2;

    const endCenterX =

      end.left + end.width / 2;

    const endCenterY =

      end.top + end.height / 2;

    flyer.style.left =

      `${startCenterX - 28}px`;

    flyer.style.top =

      `${startCenterY - 28}px`;

    document.body.appendChild(flyer);

    requestAnimationFrame(() => {

      const moveX =

        endCenterX - startCenterX;

      const moveY =

        endCenterY - startCenterY;

      flyer.style.transform =

        `translate(${moveX}px, ${moveY}px) scale(0.12) rotate(10deg)`;

      flyer.style.opacity = "0.08";

    });

    setTimeout(() => {

      setCartPulse(true);

    }, 806);

    setTimeout(() => {

      setCartPulse(false);

    }, 1236);

    setTimeout(() => {

      flyer.remove();

    }, 1170);

  }

 function addAndAnimate(

    product,

    option,

    qty,

    specialMode = "normal"

  ) {

    onAddToCart(

      product,

      option,

      qty,

      specialMode

    );

    if (

      specialMode !== "selfUse"

    ) {

      flyToCart(product);

    }

  }

 function openProduct(

    product,

    forcePopup = false

  ) {

    const hasOption =

      product.hasOption ===

        true ||

      product.hasOptions ===

        true;

    const normalUnitOption = {

      id: "normal",

      name: "ชิ้น",

      price:

        product.price,

      saleType:

        "unit",

      stockPerUnit:

        1,

    };

    /*

      สินค้าไม่มีตัวเลือก

      แตะปกติ:

      เพิ่มลงตะกร้าเหมือนเดิม

      กดค้าง:

      forcePopup = true

      เปิด Popup เพื่อให้เลือกกินเอง

    */

    if (

      !hasOption ||

      !product.options?.length

    ) {

      if (

        !forcePopup

      ) {

        addAndAnimate(

          product,

          normalUnitOption,

          1,

          "normal"

        );

        return;

      }

      setSelectedProduct(

        product

      );

      setSelectedOption(

        normalUnitOption

      );

      setPopupQty(1);

      setPopupSpecialMode(

        "normal"

      );

      return;

    }

    const normalOption =

      product.options.find(

        (option) =>
option.id ===

          "normal"

      ) ||

      product.options[0];

    setSelectedProduct(

      product

    );

    setSelectedOption({

      ...normalOption,

      saleType:

        "unit",

      stockPerUnit:

        1,

    });

    setPopupQty(1);

    setPopupSpecialMode(

      "normal"

    );

  }
 
  function openPackPopup(

    product

  ) {

    if (

      !hasPack(product)

    ) {

      return;

    }

    setPackProduct(

      product

    );

    setPackPopupQty(1);

    setPackSpecialMode(

      "normal"

    );

  }

  function closePopup() {

    setSelectedProduct(

      null

    );

    setSelectedOption(

      null

    );

    setPopupQty(1);

    setPopupSpecialMode(

      "normal"

    );

  }

  function closePackPopup() {

    setPackProduct(

      null

    );

    setPackPopupQty(1);

    setPackSpecialMode(

      "normal"

    );

  }

  function confirmPopup() {

    if (

      !selectedProduct ||

      !selectedOption

    ) {

      return;

    }

    addAndAnimate(

      selectedProduct,

      selectedOption,

      popupQty,

      popupSpecialMode

    );

    closePopup();

  }

  function confirmPackPopup() {

    if (!packProduct) {

      return;

    }

    const packQty =

      Math.max(

        2,

        Number(

          packProduct.packQty

        ) || 2

      );

    const packPrice =

      Math.max(

        0,

        Number(

          packProduct.packPrice

        ) || 0

      );

    addAndAnimate(

      packProduct,

      {

        id: "pack",

        name:

          `แพ็ก ${packQty} ชิ้น`,

        price:

          packPrice,

        saleType:

          "pack",

        stockPerUnit:

          packQty,

        packQty,

      },

      packPopupQty,

      packSpecialMode

    );

    closePackPopup();

  }

  function startLongPress(product, event) {

    rememberSource(event);

    longPressTriggeredRef.current =

      false;

    if (

      holdTimerRef.current

    ) {

      clearTimeout(

        holdTimerRef.current

      );

    }

    holdTimerRef.current =

      setTimeout(

        () => {

          longPressTriggeredRef.current =

            true;

          if (

            hasPack(product)

          ) {

            openPackPopup(

              product

            );

          } else {

            openProduct(

              product,

              true

            );

          }

          holdTimerRef.current =

            null;

        },

        LONG_PRESS_MS

      );

  }

  function cancelLongPress() {

    if (

      holdTimerRef.current

    ) {

      clearTimeout(

        holdTimerRef.current

      );

      holdTimerRef.current =

        null;

    }

  }

  function handleProductClick(product, event) {

    rememberSource(event);

    if (

      longPressTriggeredRef.current

    ) {

      longPressTriggeredRef.current =

        false;

      return;

    }

    openProduct(

      product

    );

  }

  function handlePayment() {

    if (

      cart.length === 0

    ) {

      return;

    }

    onOpenPayment();

  }

  function closeSearch() {

    setSearchOpen(

      false

    );

    setSearchText("");

  }

  const packStockUse =

    packProduct

      ? Math.max(

          2,

          Number(

            packProduct.packQty

          ) || 2

        ) *

        Number(

          packPopupQty || 0

        )

      : 0;

  const searchControl = (
<div

      className={

        searchOpen

          ? "pos-search-control open"

          : "pos-search-control"

      }
>
<button

        type="button"

        className="pos-search-toggle"

        aria-label="ค้นหาสินค้า"

        onClick={() =>

          setSearchOpen(

            (current) =>

              !current

          )

        }
>

        🔍
</button>
<div className="pos-search-slide">
<input

          ref={

            searchInputRef

          }

          type="search"

          placeholder="ค้นหาสินค้า..."

          value={

            searchText

          }

          onChange={(

            event

          ) =>

            setSearchText(

              event.target

                .value

            )

          }

        />
<button

  type="button"

  className="pos-search-close"

  onPointerDown={(event) => {

    event.preventDefault();

  }}

  onClick={() => {

    setSearchText("");

    requestAnimationFrame(() => {

      searchInputRef.current?.focus({

        preventScroll: true,

      });

    });

  }}
>

  ×
</button>
 
</div>
</div>

  );

  return (
<div className="app pos-page pos-modern">

      {searchPortalTarget &&

        createPortal(

          searchControl,

          searchPortalTarget

        )}
<main className="product-panel">
<header className="pos-modern-header pos-sticky-sales-header">
<div className="pos-title-row">
<h1>

              ขายสินค้า
</h1>
<span className="pos-product-count">

  {Number(todaySoldQty || 0).toLocaleString()}{" "}

  ชิ้นวันนี้
</span>
 
<span

              className={

                cartPulse

                  ? "pos-header-total pulse"

                  : "pos-header-total"

              }

              aria-live="polite"
>

              รวม{" "}
<b>{Number(todaySalesAmount || 0).toLocaleString()}</b>{" "}

              บาท
</span>
</div>
</header>

        {!searchPortalTarget && (
<div className="pos-search-fallback">

            {searchControl}
</div>

        )}

        {searchText && (
<div className="pos-search-result">

            พบ{" "}

            {

              filteredProducts.length

            }{" "}

            รายการ
</div>

        )}

        {filteredProducts.length ===

        0 ? (
<div className="no-product">

            ไม่พบสินค้า
</div>

        ) : (
<div className="product-grid pos-modern-grid">

            {filteredProducts.map(

              (

                product,

                index

              ) => {

                const normalPrice =

                  product.options?.find(

                    (option) =>
option.id ===

                      "normal"

                  )?.price ??

                  product.options?.[0]

                    ?.price ??

                  product.price;

                const stock =

                  getStock(
product.id

                  );

                const lowStock =

                  isLowStock(

                    product,

                    stock

                  );

                const packEnabled =

                  hasPack(

                    product

                  );

                return (
<ProductCard

                    key={
product.id

                    }

                    index={

                      index

                    }

                    product={

                      product

                    }

                    stock={

                      stock

                    }

                    lowStock={

                      lowStock

                    }

                    packEnabled={

                      packEnabled

                    }

                    normalPrice={

                      normalPrice

                    }

                    onClick={(event) =>

                      handleProductClick(

                        product,

                        event

                      )

                    }

                    onLongPressStart={(event) =>

                      startLongPress(

                        product,

                        event

                      )

                    }

                    onLongPressCancel={

                      cancelLongPress

                    }

                  />

                );

              }

            )}
</div>

        )}
</main>
<CartPanel

        cart={

          cart

        }

        totalQty={

          totalQty

        }

        total={

          total

        }

        onChangeCartQty={

          onChangeCartQty

        }

        onIncreaseQty={

          onIncreaseQty

        }

        onDecreaseQty={

          onDecreaseQty

        }

        onRemoveItem={

          onRemoveItem

        }

        onPayment={

          handlePayment

        }

      />
<ProductOptionPopup

        product={

          selectedProduct

        }

        selectedOption={

          selectedOption

        }

        quantity={

          popupQty

        }

        onSelectOption={

          setSelectedOption

        }

        onChangeQuantity={

          setPopupQty

        }

  specialMode={

          popupSpecialMode

        }

        onChangeSpecialMode={

          setPopupSpecialMode

        }

        onConfirm={

          confirmPopup

        }

        onClose={

          closePopup

        }

      />
<PackPopup

        product={

          packProduct

        }

        quantity={

          packPopupQty

        }

        stockUse={

          packStockUse

        }

        onChangeQuantity={

          setPackPopupQty

        }

  specialMode={

          packSpecialMode

        }

        onChangeSpecialMode={

          setPackSpecialMode

        }

        onConfirm={

          confirmPackPopup

        }

        onClose={

          closePackPopup

        }

      />
</div>

  );

}

export default POSPage;
 
