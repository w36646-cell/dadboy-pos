import { useMemo, useState } from "react";

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

}) {

  const [searchText, setSearchText] = useState("");

  const [selectedProduct, setSelectedProduct] =

    useState(null);

  const [selectedOption, setSelectedOption] =

    useState(null);

  const [popupQty, setPopupQty] = useState(1);

  const filteredProducts = useMemo(() => {

    const keyword =

      searchText.trim().toLowerCase();

    if (!keyword) {

      return products;

    }

    return products.filter((product) =>

      product.name

        .toLowerCase()

        .includes(keyword)

    );

  }, [products, searchText]);

  const totalQty = cart.reduce(

    (sum, item) =>

      sum + Number(item.qty || 0),

    0

  );

  const total = cart.reduce(

    (sum, item) =>

      sum +

      Number(item.price || 0) *

        Number(item.qty || 0),

    0

  );

  function getStock(productId) {

    return Number(

      inventory[productId] ?? 50

    );

  }

  function openProduct(product) {

    const hasOption =

      product.hasOption === true ||

      product.hasOptions === true;

    if (

      !hasOption ||

      !product.options?.length

    ) {

      onAddToCart(

        product,

        {

          name: "ปกติ",

          price: product.price,

        },

        1

      );

      return;

    }

    const normalOption =

      product.options.find(

        (option) =>
option.id === "normal"

      ) || product.options[0];

    setSelectedProduct(product);

    setSelectedOption(normalOption);

    setPopupQty(1);

  }

  function closePopup() {

    setSelectedProduct(null);

    setSelectedOption(null);

    setPopupQty(1);

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

  function handlePayment() {

    if (cart.length === 0) {

      return;

    }

    onOpenPayment();

  }

  return (
<div className="app pos-page">
<main className="product-panel">
<header className="pos-page-header">
<div>
<h1>ขายสินค้า</h1>
<p>

              สินค้า {filteredProducts.length} รายการ
</p>
</div>
</header>
<input

          className="search-input"

          type="search"

          placeholder="ค้นหาสินค้า..."

          value={searchText}

          onChange={(event) =>

            setSearchText(

              event.target.value

            )

          }

        />

        {filteredProducts.length === 0 ? (
<div className="no-product">

            ไม่พบสินค้า
</div>

        ) : (
<div className="product-grid">

            {filteredProducts.map(

              (product) => {

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

                  getStock(product.id);

                return (
<button

                    type="button"

                    className="product-card product-card-touch"

                    key={product.id}

                    onClick={() =>

                      openProduct(product)

                    }
>
<div className="product-image-box">

                      {product.image ? (
<img

                          className="product-image"

                          src={product.image}

                          alt={

                            product.name ||

                            "สินค้า"

                          }

                          onError={(event) => {

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

                      {product.name}
</div>
<div className="product-price">

                      {normalPrice} บาท
</div>
<div

                      className={

                        stock < 0

                          ? "stock-text stock-negative"

                          : "stock-text"

                      }
>

                      คงเหลือ {stock}
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
<h2>ตะกร้า</h2>
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

              (item, index) => (
<div

                  className="cart-item"

                  key={`${item.id}-${item.option}`}
>
<div className="cart-item-header">
<div>
<strong>

                        {item.name}
</strong>
<div className="cart-option">

                        {item.option} ·{" "}

                        {item.price} บาท
</div>
</div>
<button

                      className="remove-button"

                      type="button"

                      onClick={() =>

                        onRemoveItem(index)

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

                        value={item.qty}

                        onChange={(event) =>

                          onChangeCartQty(

                            index,

                            event.target.value

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
<span>รวมทั้งหมด</span>
<span>

            {total.toLocaleString()} บาท
</span>
</div>
<button

          className="pay-button"

          type="button"

          disabled={

            cart.length === 0

          }

          onClick={handlePayment}
>

          คิดเงิน
</button>
</aside>

      {selectedProduct &&

        selectedOption && (
<div

            className="popup-overlay"

            onClick={closePopup}
>
<div

              className="popup"

              onClick={(event) =>

                event.stopPropagation()

              }
>
<h2>

                {selectedProduct.name}
</h2>
<div className="option-list">

                {selectedProduct.options.map(

                  (option) => (
<label

                      className={
selectedOption.id ===
option.id

                          ? "option-button selected-option"

                          : "option-button"

                      }

                      key={option.id}
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

                            setSelectedOption(

                              option

                            )

                          }

                        />

                        {" "}

                        {option.name}
</span>
<strong>

                        {option.price} บาท
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

                      (quantity) =>

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

                  value={popupQty}

                  onChange={(event) =>

                    setPopupQty(

                      Math.max(

                        1,

                        Number(

                          event.target.value

                        ) || 1

                      )

                    )

                  }

                />
<button

                  type="button"

                  onClick={() =>

                    setPopupQty(

                      (quantity) =>

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

                  Number(popupQty)

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

                onClick={closePopup}
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
 