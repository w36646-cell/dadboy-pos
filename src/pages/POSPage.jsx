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

import SyncStatus from "../components/pos/SyncStatus";

import "../styles/POSModern.css";

function POSPage({

  products,

  inventory,

  cart,

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

    packProduct,

    setPackProduct,

  ] = useState(null);

  const [

    packPopupQty,

    setPackPopupQty,

  ] = useState(1);

  const searchInputRef =

    useRef(null);

  const holdTimerRef =

    useRef(null);

  const longPressTriggeredRef =

    useRef(false);

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

          ".employee-pos-topbar > div"

        );

      setSearchPortalTarget(

        target

      );

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

      searchInputRef.current.focus();

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

        return products;

      }

      return products.filter(

        (product) =>

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

  function openProduct(

    product

  ) {

    const hasOption =

      product.hasOption ===

        true ||

      product.hasOptions ===

        true;

    if (

      !hasOption ||

      !product.options?.length

    ) {

      onAddToCart(

        product,

        {

          id: "normal",

          name: "ชิ้น",

          price:

            product.price,

          saleType:

            "unit",

          stockPerUnit:

            1,

        },

        1

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

      saleType: "unit",

      stockPerUnit: 1,

    });

    setPopupQty(1);

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

  }

  function closePopup() {

    setSelectedProduct(

      null

    );

    setSelectedOption(

      null

    );

    setPopupQty(1);

  }

  function closePackPopup() {

    setPackProduct(

      null

    );

    setPackPopupQty(1);

  }

  function confirmPopup() {

    if (

      !selectedProduct ||

      !selectedOption

    ) {

      return;

    }

    onAddToCart(

      selectedProduct,

      selectedOption,

      popupQty

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

    onAddToCart(

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

      packPopupQty

    );

    closePackPopup();

  }

  function startLongPress(

    product

  ) {

    longPressTriggeredRef.current =

      false;

    if (

      holdTimerRef.current

    ) {

      clearTimeout(

        holdTimerRef.current

      );

    }

    if (

      !hasPack(product)

    ) {

      return;

    }

    holdTimerRef.current =

      setTimeout(

        () => {

          longPressTriggeredRef.current =

            true;

          openPackPopup(

            product

          );

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

  function handleProductClick(

    product

  ) {

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

          onClick={

            closeSearch

          }
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
<header className="pos-modern-header">
<div className="pos-title-row">
<h1>

              ขายสินค้า
</h1>
<span className="pos-product-count">

              {

                filteredProducts.length

              }{" "}

              สินค้า
</span>
</div>
<div className="pos-sync-corner">
<SyncStatus

              isOnline={

                isOnline

              }

              cloudReady={

                cloudReady

              }

              pendingSaleCount={

                pendingSaleCount

              }

              pendingStockCount={

                pendingStockCount

              }

            />
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

                    onClick={() =>

                      handleProductClick(

                        product

                      )

                    }

                    onLongPressStart={() =>

                      startLongPress(

                        product

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
 