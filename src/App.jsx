import { useMemo, useState } from "react";

import defaultProducts from "./data/products";

import StockManager from "./components/StockManager";

import ProductManager from "./components/ProductManager";

import OwnerLogin from "./components/OwnerLogin";

import OwnerSidebar from "./components/OwnerSidebar";

import DashboardPage from "./pages/DashboardPage";

import ReportPage from "./pages/ReportPage";

import BillsPage from "./pages/BillsPage";

import "./styles/App.css";

const STOCK_KEY = "dadboy_inventory_v2";

const SALES_KEY = "dadboy_sales_v1";

const PRODUCTS_KEY = "dadboy_products_v1";

function readStorage(key, fallback) {

  try {

    const saved = localStorage.getItem(key);

    return saved

      ? JSON.parse(saved)

      : fallback;

  } catch {

    return fallback;

  }

}

function loadProducts() {

  const saved = readStorage(

    PRODUCTS_KEY,

    null

  );

  return Array.isArray(saved)

    ? saved

    : defaultProducts;

}

function loadInventory(productList) {

  const saved = readStorage(

    STOCK_KEY,

    null

  );

  if (

    saved &&

    typeof saved === "object"

  ) {

    return saved;

  }

  const result = {};

  productList.forEach((product) => {

    result[product.id] = Number(

      product.stock ?? 50

    );

  });

  return result;

}

function App() {

  const initialProducts =

    loadProducts();

  const [products, setProducts] =

    useState(initialProducts);

  const [inventory, setInventory] =

    useState(() =>

      loadInventory(initialProducts)

    );

  const [page, setPage] =

    useState("pos");

  const [ownerMode, setOwnerMode] =

    useState(false);

  const [loginOpen, setLoginOpen] =

    useState(false);

  const [cart, setCart] =

    useState([]);

  const [searchText, setSearchText] =

    useState("");

  const [

    selectedProduct,

    setSelectedProduct,

  ] = useState(null);

  const [

    selectedOption,

    setSelectedOption,

  ] = useState(null);

  const [popupQty, setPopupQty] =

    useState(1);

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

            .includes(keyword)

      );

    }, [

      products,

      searchText,

    ]);

  function saveProducts(

    newProducts

  ) {

    setProducts(newProducts);

    localStorage.setItem(

      PRODUCTS_KEY,

      JSON.stringify(

        newProducts

      )

    );

  }

  function saveProduct(

    updatedProduct

  ) {

    saveProducts(

      products.map(

        (product) =>
product.id ===
updatedProduct.id

            ? updatedProduct

            : product

      )

    );

  }

  function saveInventory(

    newInventory

  ) {

    setInventory(newInventory);

    localStorage.setItem(

      STOCK_KEY,

      JSON.stringify(

        newInventory

      )

    );

  }

  function getStock(productId) {

    return Number(

      inventory[productId] ?? 50

    );

  }

  function addStock(

    productId,

    quantity

  ) {

    const safeQty =

      Number(quantity);

    if (

      !Number.isFinite(safeQty) ||

      safeQty <= 0

    ) {

      return;

    }

    saveInventory({

      ...inventory,

      [productId]:

        getStock(productId) +

        safeQty,

    });

  }

  function addToCart(

    product,

    option,

    quantity = 1

  ) {

    const safeQty = Math.max(

      1,

      Number(quantity) || 1

    );

    const cost = Number(

      product.cost || 0

    );

    setCart((currentCart) => {

      const found =

        currentCart.find(

          (item) =>
item.id ===
product.id &&

            item.option ===

              option.name

        );

      if (found) {

        return currentCart.map(

          (item) =>
item.id ===
product.id &&

            item.option ===

              option.name

              ? {

                  ...item,

                  name:

                    product.name,

                  price:

                    Number(

                      option.price

                    ),

                  cost,

                  qty:

                    item.qty +

                    safeQty,

                }

              : item

        );

      }

      return [

        ...currentCart,

        {

          id:
product.id,

          name:

            product.name,

          option:

            option.name,

          price:

            Number(

              option.price

            ),

          cost,

          qty:

            safeQty,

        },

      ];

    });

  }

  function openProduct(product) {

    const hasOption =

      product.hasOption === true ||

      product.hasOptions === true;

    if (

      !hasOption ||

      !product.options?.length

    ) {

      addToCart(

        product,

        {

          name: "ปกติ",

          price:

            product.price,

        }

      );

      return;

    }

    const normalOption =

      product.options.find(

        (option) =>
option.id === "normal"

      ) ||

      product.options[0];

    setSelectedProduct(

      product

    );

    setSelectedOption(

      normalOption

    );

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

    addToCart(

      selectedProduct,

      selectedOption,

      popupQty

    );

    closePopup();

  }

  function changeCartQty(

    index,

    quantity

  ) {

    const safeQty = Math.max(

      1,

      Number(quantity) || 1

    );

    setCart((currentCart) =>

      currentCart.map(

        (item, itemIndex) =>

          itemIndex === index

            ? {

                ...item,

                qty: safeQty,

              }

            : item

      )

    );

  }

  function increaseQty(index) {

    setCart((currentCart) =>

      currentCart.map(

        (item, itemIndex) =>

          itemIndex === index

            ? {

                ...item,

                qty:

                  item.qty + 1,

              }

            : item

      )

    );

  }

  function decreaseQty(index) {

    setCart((currentCart) =>

      currentCart

        .map(

          (item, itemIndex) =>

            itemIndex === index

              ? {

                  ...item,

                  qty:

                    item.qty - 1,

                }

              : item

        )

        .filter(

          (item) =>

            item.qty > 0

        )

    );

  }

  function removeItem(index) {

    setCart((currentCart) =>

      currentCart.filter(

        (_, itemIndex) =>

          itemIndex !== index

      )

    );

  }

  const totalQty =

    cart.reduce(

      (sum, item) =>

        sum + item.qty,

      0

    );

  const total =

    cart.reduce(

      (sum, item) =>

        sum +

        item.price *

          item.qty,

      0

    );

  function completeSale() {

    if (cart.length === 0) {

      return;

    }

    const soldByProduct = {};

    cart.forEach((item) => {

      soldByProduct[item.id] =

        (soldByProduct[item.id] || 0) +

        item.qty;

    });

    const newInventory = {

      ...inventory,

    };

    Object.entries(

      soldByProduct

    ).forEach(

      ([productId, quantity]) => {

        newInventory[productId] =

          Number(

            newInventory[

              productId

            ] ?? 50

          ) -

          Number(quantity);

      }

    );

    const saleItems =

      cart.map((item) => {

        const unitCost =

          Number(

            item.cost || 0

          );

        const lineTotal =

          item.price *

          item.qty;

        const lineCost =

          unitCost *

          item.qty;

        return {

          productId:
item.id,

          productName:

            item.name,

          option:

            item.option,

          unitPrice:

            item.price,

          unitCost,

          quantity:

            item.qty,

          lineTotal,

          lineCost,

          lineProfit:

            lineTotal -

            lineCost,

        };

      });

    const totalCost =

      saleItems.reduce(

        (sum, item) =>

          sum +

          item.lineCost,

        0

      );

    const now =

      new Date();

    const sale = {

      billId:

        `DB-${now.getTime()}`,

      soldAt:

        now.toISOString(),

      soldDate:

        now.toLocaleDateString(

          "en-CA"

        ),

      soldTime:

        now.toLocaleTimeString(

          "th-TH"

        ),

      totalQty,

      totalAmount:

        total,

      totalCost,

      totalProfit:

        total - totalCost,

      items:

        saleItems,

    };

    const sales =

      readStorage(

        SALES_KEY,

        []

      );

    localStorage.setItem(

      SALES_KEY,

      JSON.stringify([

        ...sales,

        sale,

      ])

    );

    saveInventory(

      newInventory

    );

    setCart([]);

    window.alert(

      `บันทึกบิลสำเร็จ\nยอดรวม ${total} บาท`

    );

  }

  function enterOwnerMode() {

    setOwnerMode(true);

    setLoginOpen(false);

    setPage("dashboard");

  }

  function exitOwnerMode() {

    setOwnerMode(false);

    setPage("pos");

  }

  function renderPOS() {

    return (
<div className="app">
<main className="product-panel">
<header className="main-header">
<h1>

              Dadboy POS
</h1>

            {!ownerMode && (
<div className="header-buttons">
<button

                  className="stock-menu-button"

                  type="button"

                  onClick={() =>

                    setPage("stock")

                  }
>

                  รับสินค้าเข้า
</button>
<button

                  className="product-menu-button"

                  type="button"

                  onClick={() =>

                    setLoginOpen(true)

                  }
>

                  โหมดเจ้าของร้าน
</button>
</div>

            )}
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

                  getStock(
product.id

                  );

                return (
<article

                    className="product-card"

                    key={product.id}

                    onClick={() =>

                      openProduct(

                        product

                      )

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

                            product.name

                          }

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
</article>

                );

              }

            )}
</div>
</main>
<aside className="cart-panel">
<div className="cart-header">
<h2>

              🛒 ตะกร้า
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

                          {item.name}
</strong>
<div className="cart-option">

                          {item.option}

                          {" · "}

                          {item.price} บาท
</div>
</div>
<button

                        className="remove-button"

                        type="button"

                        onClick={() =>

                          removeItem(

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

                            decreaseQty(

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

                            changeCartQty(

                              index,

                              event.target

                                .value

                            )

                          }

                        />
<button

                          type="button"

                          onClick={() =>

                            increaseQty(

                              index

                            )

                          }
>

                          +
</button>
</div>
<strong>

                        {item.price *

                          item.qty}{" "}

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

              {total} บาท
</span>
</div>
<button

            className="pay-button"

            type="button"

            disabled={

              cart.length === 0

            }

            onClick={

              completeSale

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

                    (option) => (
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

                        (qty) =>

                          Math.max(

                            1,

                            Number(qty) -

                              1

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

                        (qty) =>

                          Number(qty) +

                          1

                      )

                    }
>

                    +
</button>
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
</div>

    );

  }

  function renderOwnerPage() {

    if (page === "dashboard") {

      return (
<DashboardPage />

      );

    }

    if (page === "reports") {

      return (
<ReportPage />

      );

    }

    if (page === "bills") {

      return (
<BillsPage />

      );

    }

    if (page === "products") {

      return (
<ProductManager

          products={products}

          inventory={inventory}

          onSaveProduct={

            saveProduct

          }

          onClose={() =>

            setPage("pos")

          }

        />

      );

    }

    if (page === "stock") {

      return (
<StockManager

          products={products}

          inventory={inventory}

          onAddStock={

            addStock

          }

          onClose={() =>

            setPage("pos")

          }

        />

      );

    }

    if (page === "settings") {

      return (
<div className="owner-placeholder-page">
<h1>

            ตั้งค่า
</h1>
<p>

            เราจะทำหน้านี้ต่อ
</p>
</div>

      );

    }

    return renderPOS();

  }

  if (

    !ownerMode &&

    page === "stock"

  ) {

    return (
<StockManager

        products={products}

        inventory={

          inventory

        }

        onAddStock={

          addStock

        }

        onClose={() =>

          setPage("pos")

        }

      />

    );

  }

  return (
<>

      {ownerMode ? (
<div className="owner-app-shell">
<OwnerSidebar

            currentPage={page}

            onChangePage={

              setPage

            }

            onLogout={

              exitOwnerMode

            }

          />
<main className="owner-app-content">

            {renderOwnerPage()}
</main>
</div>

      ) : (

        renderPOS()

      )}
<OwnerLogin

        open={loginOpen}

        onSuccess={

          enterOwnerMode

        }

        onClose={() =>

          setLoginOpen(false)

        }

      />
</>

  );

}

export default App;