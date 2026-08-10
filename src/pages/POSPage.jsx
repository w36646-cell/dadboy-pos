import {

  useMemo,

  useRef,

  useState,

} from "react";

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

  const holdTimerRef =

    useRef(null);

  const longPressTriggeredRef =

    useRef(false);

  const LONG_PRESS_MS =

    550;

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

          product.name

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

        product.packPrice || 0

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

    /*

      สินค้าปกติ:

      แตะครั้งเดียว = เพิ่ม 1 ชิ้น

    */

    if (

      !hasOption ||

      !product.options?.length

    ) {

      onAddToCart(

        product,

        {

          id:

            "normal",

          name:

            "ชิ้น",

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

    /*

      สินค้าที่มีตัวเลือกแก้ว:

      แตะ = เปิด Popup เดิม

    */

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

        id:

          "pack",

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

    /*

      ถ้าเพิ่งเกิด Long Press

      ห้าม click ซ้ำแล้วเพิ่มสินค้าเป็นชิ้น

    */

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

  const hasPending =

    Number(

      pendingSaleCount || 0

    ) > 0 ||

    Number(

      pendingStockCount || 0

    ) > 0;

  let syncText =

    "";

  let statusBackground =

    "#ecfdf3";

  let statusBorder =

    "#abefc6";

  let statusColor =

    "#067647";

  let dotColor =

    "#12b76a";

  if (!isOnline) {

    syncText =

      "ออฟไลน์ · บันทึกข้อมูลไว้ในเครื่อง";

    statusBackground =

      "#fff7ed";

    statusBorder =

      "#fed7aa";

    statusColor =

      "#9a3412";

    dotColor =

      "#f97316";

  } else if (

    hasPending

  ) {

    const parts =

      [];

    if (

      pendingSaleCount > 0

    ) {

      parts.push(

        `${pendingSaleCount} บิล`

      );

    }

    if (

      pendingStockCount > 0

    ) {

      parts.push(

        `${pendingStockCount} Stock`

      );

    }

    syncText =

      `ออนไลน์ · รอ Sync ${parts.join(

        " / "

      )}`;

    statusBackground =

      "#fffaeb";

    statusBorder =

      "#fedf89";

    statusColor =

      "#93370d";

    dotColor =

      "#f79009";

  } else if (

    cloudReady

  ) {

    syncText =

      "ออนไลน์ · Sync เรียบร้อย";

  } else {

    syncText =

      "ออนไลน์ · กำลังเชื่อมต่อ Cloud";

    statusBackground =

      "#eff8ff";

    statusBorder =

      "#b2ddff";

    statusColor =

      "#175cd3";

    dotColor =

      "#2e90fa";

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

  return (
<div className="app pos-page">
<main className="product-panel">
<header className="pos-page-header">
<div>
<h1>

              ขายสินค้า
</h1>
<p>

              สินค้า{" "}

              {

                filteredProducts.length

              }{" "}

              รายการ
</p>
</div>
<div

            style={{

              display:

                "flex",

              alignItems:

                "center",

              gap:

                "8px",

              padding:

                "8px 12px",

              borderRadius:

                "999px",

              background:

                statusBackground,

              border:

                `1px solid ${statusBorder}`,

              color:

                statusColor,

              fontSize:

                "13px",

              fontWeight:

                "700",

              whiteSpace:

                "nowrap",

            }}
>
<span

              style={{

                width:

                  "9px",

                height:

                  "9px",

                borderRadius:

                  "999px",

                background:

                  dotColor,

                display:

                  "inline-block",

                flexShrink:

                  0,

              }}

            />

            {syncText}
</div>
</header>
<input

          className="search-input"

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

        {filteredProducts.length ===

        0 ? (
<div className="no-product">

            ไม่พบสินค้า
</div>

        ) : (
<div className="product-grid">

            {filteredProducts.map(

              (

                product

              ) => {

                const normalPrice =

                  product.options?.find(

                    (

                      option

                    ) =>
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
<button

                    type="button"

                    className="product-card product-card-touch"

                    key={
product.id

                    }

                    onClick={() =>

                      handleProductClick(

                        product

                      )

                    }

                    onMouseDown={() =>

                      startLongPress(

                        product

                      )

                    }

                    onMouseUp={

                      cancelLongPress

                    }

                    onMouseLeave={

                      cancelLongPress

                    }

                    onTouchStart={() =>

                      startLongPress(

                        product

                      )

                    }

                    onTouchEnd={

                      cancelLongPress

                    }

                    onTouchCancel={

                      cancelLongPress

                    }

                    onContextMenu={(

                      event

                    ) =>

                      event.preventDefault()

                    }
>
<div className="product-image-box">

                      {product.image ? (
<img

                          className="product-image"

                          src={

                            product.image

                          }

                          alt={

                            product.name ||

                            "สินค้า"

                          }

                          onError={(

                            event

                          ) => {

                            event.currentTarget.style.display =

                              "none";

                          }}

                        />

                      ) : (
<span>

                          ไม่มีรูป
</span>

                      )}
</div>
<div className="product-name">

                      {

                        product.name

                      }
</div>
<div className="product-price">

                      {

                        normalPrice

                      }{" "}

                      บาท
</div>

                    {packEnabled && (
<div

                        style={{

                          marginTop:

                            "4px",

                          fontSize:

                            "11px",

                          color:

                            "#667085",

                        }}
>

                        กดค้าง: แพ็ก{" "}

                        {

                          product.packQty

                        }{" "}

                        ชิ้น{" "}

                        {Number(

                          product.packPrice

                        ).toLocaleString()}{" "}

                        บาท
</div>

                    )}
<div

                      className={

                        lowStock

                          ? "stock-text stock-negative"

                          : "stock-text"

                      }
>

                      คงเหลือ{" "}

                      {stock}
</div>
</button>

                );

              }

            )}
</div>

        )}
</main>
<aside className="cart-panel">
<div className="cart-header">
<h2>

            ตะกร้า
</h2>
<span className="cart-badge">

            {totalQty}
</span>
</div>
<div className="cart-list">

          {cart.length === 0 ? (
<p className="empty-cart">

              ยังไม่มีสินค้า
</p>

          ) : (

            cart.map(

              (

                item,

                index

              ) => (
<div

                  className="cart-item"

                  key={`${item.id}-${item.option}`}
>
<div className="cart-item-header">
<div>
<strong>

                        {

                          item.name

                        }
</strong>
<div className="cart-option">

                        {

                          item.option

                        }{" "}

                        ·{" "}

                        {

                          item.price

                        }{" "}

                        บาท
</div>
</div>
<button

                      className="remove-button"

                      type="button"

                      onClick={() =>

                        onRemoveItem(

                          index

                        )

                      }
>

                      ลบ
</button>
</div>
<div className="cart-item-bottom">
<div className="quantity-controls">
<button

                        type="button"

                        onClick={() =>

                          onDecreaseQty(

                            index

                          )

                        }
>

                        −
</button>
<input

                        className="quantity-input"

                        type="number"

                        min="1"

                        value={

                          item.qty

                        }

                        onChange={(

                          event

                        ) =>

                          onChangeCartQty(

                            index,

                            event.target

                              .value

                          )

                        }

                      />
<button

                        type="button"

                        onClick={() =>

                          onIncreaseQty(

                            index

                          )

                        }
>

                        +
</button>
</div>
<strong>

                      {Number(

                        item.price *

                          item.qty

                      ).toLocaleString()}{" "}

                      บาท
</strong>
</div>
</div>

              )

            )

          )}
</div>
<div className="grand-total">
<span>

            รวมทั้งหมด
</span>
<span>

            {total.toLocaleString()}{" "}

            บาท
</span>
</div>
<button

          className="pay-button"

          type="button"

          disabled={

            cart.length === 0

          }

          onClick={

            handlePayment

          }
>

          คิดเงิน
</button>
</aside>

      {selectedProduct &&

        selectedOption && (
<div

            className="popup-overlay"

            onClick={

              closePopup

            }
>
<div

              className="popup"

              onClick={(

                event

              ) =>

                event.stopPropagation()

              }
>
<h2>

                {

                  selectedProduct.name

                }
</h2>
<div className="option-list">

                {selectedProduct.options.map(

                  (

                    option

                  ) => (
<label

                      className={
selectedOption.id ===
option.id

                          ? "option-button selected-option"

                          : "option-button"

                      }

                      key={
option.id

                      }
>
<span>
<input

                          type="radio"

                          name="product-option"

                          checked={
selectedOption.id ===
option.id

                          }

                          onChange={() =>

                            setSelectedOption({

                              ...option,

                              saleType:

                                "unit",

                              stockPerUnit:

                                1,

                            })

                          }

                        />{" "}

                        {

                          option.name

                        }
</span>
<strong>

                        {

                          option.price

                        }{" "}

                        บาท
</strong>
</label>

                  )

                )}
</div>
<div className="popup-quantity">
<button

                  type="button"

                  onClick={() =>

                    setPopupQty(

                      (

                        quantity

                      ) =>

                        Math.max(

                          1,

                          Number(

                            quantity

                          ) - 1

                        )

                    )

                  }
>

                  −
</button>
<input

                  className="quantity-input"

                  type="number"

                  min="1"

                  value={

                    popupQty

                  }

                  onChange={(

                    event

                  ) =>

                    setPopupQty(

                      Math.max(

                        1,

                        Number(

                          event.target

                            .value

                        ) || 1

                      )

                    )

                  }

                />
<button

                  type="button"

                  onClick={() =>

                    setPopupQty(

                      (

                        quantity

                      ) =>

                        Number(

                          quantity

                        ) + 1

                    )

                  }
>

                  +
</button>
</div>
<div className="popup-total">

                รวม{" "}

                {(

                  Number(

                    selectedOption.price

                  ) *

                  Number(

                    popupQty

                  )

                ).toLocaleString()}{" "}

                บาท
</div>
<button

                className="pay-button"

                type="button"

                onClick={

                  confirmPopup

                }
>

                เพิ่มลงตะกร้า
</button>
<button

                className="cancel-button"

                type="button"

                onClick={

                  closePopup

                }
>

                ยกเลิก
</button>
</div>
</div>

        )}

      {packProduct && (
<div

          className="popup-overlay"

          onClick={

            closePackPopup

          }
>
<div

            className="popup"

            onClick={(

              event

            ) =>

              event.stopPropagation()

            }
>
<h2>

              {

                packProduct.name

              }
</h2>
<div

              style={{

                marginBottom:

                  "14px",

                padding:

                  "10px 12px",

                borderRadius:

                  "9px",

                background:

                  "#eff8ff",

                color:

                  "#175cd3",

                textAlign:

                  "center",

                fontWeight:

                  700,

              }}
>

              แพ็ก{" "}

              {

                packProduct.packQty

              }{" "}

              ชิ้น ·{" "}

              {Number(

                packProduct.packPrice

              ).toLocaleString()}{" "}

              บาท
</div>
<div className="popup-quantity">
<button

                type="button"

                onClick={() =>

                  setPackPopupQty(

                    (

                      quantity

                    ) =>

                      Math.max(

                        1,

                        Number(

                          quantity

                        ) - 1

                      )

                  )

                }
>

                −
</button>
<input

                className="quantity-input"

                type="number"

                min="1"

                value={

                  packPopupQty

                }

                onChange={(

                  event

                ) =>

                  setPackPopupQty(

                    Math.max(

                      1,

                      Number(

                        event.target

                          .value

                      ) || 1

                    )

                  )

                }

              />
<button

                type="button"

                onClick={() =>

                  setPackPopupQty(

                    (

                      quantity

                    ) =>

                      Number(

                        quantity

                      ) + 1

                  )

                }
>

                +
</button>
</div>
<div

              style={{

                marginTop:

                  "10px",

                marginBottom:

                  "10px",

                textAlign:

                  "center",

                color:

                  "#475467",

                fontSize:

                  "13px",

              }}
>

              {packPopupQty} แพ็ก ={" "}
<strong>

                {

                  packStockUse

                }{" "}

                ชิ้น
</strong>
</div>
<div className="popup-total">

              รวม{" "}

              {(

                Number(

                  packProduct.packPrice ||

                    0

                ) *

                Number(

                  packPopupQty ||

                    0

                )

              ).toLocaleString()}{" "}

              บาท
</div>
<button

              className="pay-button"

              type="button"

              onClick={

                confirmPackPopup

              }
>

              เพิ่มแพ็กลงตะกร้า
</button>
<button

              className="cancel-button"

              type="button"

              onClick={

                closePackPopup

              }
>

              ยกเลิก
</button>
</div>
</div>

      )}
</div>

  );

}

export default POSPage;
 