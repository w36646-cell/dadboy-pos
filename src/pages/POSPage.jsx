import { useMemo, useState } from "react";

import ProductCard from "../components/ProductCard";

function POSPage({

  products,

  inventory,

  cart,

  onAddToCart,

  onChangeCartQty,

  onIncreaseQty,

  onDecreaseQty,

  onRemoveItem,

  onCompleteSale,

}) {

  const [searchText, setSearchText] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] =

    useState(null);

  const [selectedOption, setSelectedOption] =

    useState(null);

  const [popupQty, setPopupQty] = useState(1);

  const filteredProducts = useMemo(() => {

    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {

      return products;

    }

    return products.filter((product) =>

      product.name.toLowerCase().includes(keyword)

    );

  }, [products, searchText]);

  const totalQty = cart.reduce(

    (sum, item) => sum + Number(item.qty || 0),

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

    return Number(inventory[productId] ?? 50);

  }

  function openProduct(product) {

    const options = Array.isArray(product.options)

      ? product.options

      : [];

    const needsPopup =

      product.hasOption === true ||

      product.hasOptions === true;

    if (!needsPopup || options.length === 0) {

      const normalOption =

        options.find(

          (option) => option.id === "normal"

        ) ||

        options[0] || {

          id: "normal",

          name: "ปกติ",

          price: product.price,

        };

      onAddToCart(product, normalOption, 1);

      return;

    }

    const normalOption =

      options.find(

        (option) => option.id === "normal"

      ) || options[0];

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

    if (!selectedProduct || !selectedOption) {

      return;

    }

    onAddToCart(

      selectedProduct,

      selectedOption,

      popupQty

    );

    closePopup();

  }

  return (
<div className="pos-page">
<main className="product-panel">
<div className="pos-topbar">
<div className="pos-count">

            {filteredProducts.length} รายการ
</div>
<button

            type="button"

            className="search-icon-button"

            onClick={() => {

              setSearchOpen((value) => !value);

              if (searchOpen) {

                setSearchText("");

              }

            }}

            aria-label="ค้นหาสินค้า"
>

            🔍
</button>
</div>

        {searchOpen && (
<div className="search-popup-row">
<input

              className="search-input"

              type="search"

              placeholder="ค้นหาสินค้า..."

              value={searchText}

              onChange={(event) =>

                setSearchText(event.target.value)

              }

              autoFocus

            />
<button

              type="button"

              className="search-close-button"

              onClick={() => {

                setSearchOpen(false);

                setSearchText("");

              }}
>

              ✕
</button>
</div>

        )}
<div className="product-grid compact-product-grid">

          {filteredProducts.map((product) => (
<ProductCard

              key={product.id}

              product={product}

              stock={getStock(product.id)}

              onClick={openProduct}

            />

          ))}
</div>
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

            cart.map((item, index) => (
<div

                className="cart-item"

                key={`${item.id}-${item.option}`}
>
<div className="cart-item-header">
<div>
<strong>{item.name}</strong>
<div className="cart-option">

                      {item.option} · {item.price} บาท
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

                        onDecreaseQty(index)

                      }
>

                      −
</button>
<input

                      className="quantity-input"

                      type="number"

                      inputMode="numeric"

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

                        onIncreaseQty(index)

                      }
>

                      +
</button>
</div>
<strong>

                    {Number(item.price) *

                      Number(item.qty)}{" "}

                    บาท
</strong>
</div>
</div>

            ))

          )}
</div>
<div className="grand-total">
<span>รวมทั้งหมด</span>
<strong>

            {total.toLocaleString()} บาท
</strong>
</div>
<button

          className="pay-button"

          type="button"

          disabled={cart.length === 0}

          onClick={onCompleteSale}
>

          คิดเงิน
</button>
</aside>

      {selectedProduct && selectedOption && (
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
<h2>{selectedProduct.name}</h2>
<div className="option-list">

              {selectedProduct.options.map(

                (option) => (
<label

                    key={option.id}

                    className={
selectedOption.id === option.id

                        ? "option-button selected-option"

                        : "option-button"

                    }
>
<span>
<input

                        type="radio"

                        name="product-option"

                        checked={
selectedOption.id === option.id

                        }

                        onChange={() =>

                          setSelectedOption(option)

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

                  setPopupQty((qty) =>

                    Math.max(1, Number(qty) - 1)

                  )

                }
>

                −
</button>
<input

                className="quantity-input"

                type="number"

                min="1"

                inputMode="numeric"

                value={popupQty}

                onChange={(event) =>

                  setPopupQty(

                    Math.max(

                      1,

                      Number(event.target.value) || 1

                    )

                  )

                }

              />
<button

                type="button"

                onClick={() =>

                  setPopupQty(

                    (qty) => Number(qty) + 1

                  )

                }
>

                +
</button>
</div>
<div className="popup-total">

              รวม{" "}

              {Number(selectedOption.price) *

                Number(popupQty)}{" "}

              บาท
</div>
<button

              className="pay-button"

              type="button"

              onClick={confirmPopup}
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
 