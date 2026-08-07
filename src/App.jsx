import { useState } from "react";

import defaultProducts from "./data/products";

import POSPage from "./pages/POSPage";

import DashboardPage from "./pages/DashboardPage";

import ProductManager from "./components/ProductManager";

import StockManager from "./components/StockManager";

import OwnerLogin from "./components/OwnerLogin";

import Sidebar from "./components/Sidebar";

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

      loadInventory(

        initialProducts

      )

    );

  const [cart, setCart] =

    useState([]);

  const [page, setPage] =

    useState("pos");

  const [ownerMode, setOwnerMode] =

    useState(false);

  const [loginOpen, setLoginOpen] =

    useState(false);

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

    const newProducts =

      products.map(

        (product) =>
product.id ===
updatedProduct.id

            ? updatedProduct

            : product

      );

    saveProducts(newProducts);

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

      inventory[

        productId

      ] ?? 50

    );

  }

  function addStock(

    productId,

    quantity

  ) {

    const qty =

      Number(quantity);

    if (

      !Number.isFinite(qty) ||

      qty <= 0

    ) {

      return;

    }

    saveInventory({

      ...inventory,

      [productId]:

        getStock(productId) +

        qty,

    });

  }

  function addToCart(

    product,

    option,

    quantity = 1

  ) {

    const qty = Math.max(

      1,

      Number(quantity) || 1

    );

    const price =

      Number(

        option?.price ??

          product.price ??

          0

      );

    const optionName =

      option?.name ??

      "ปกติ";

    const cost =

      Number(

        product.cost || 0

      );

    setCart(

      (currentCart) => {

        const found =

          currentCart.find(

            (item) =>
item.id ===
product.id &&

              item.option ===

                optionName

          );

        if (found) {

          return currentCart.map(

            (item) =>
item.id ===
product.id &&

              item.option ===

                optionName

                ? {

                    ...item,

                    qty:

                      item.qty +

                      qty,

                  }

                : item

          );

        }

        return [

          ...currentCart,

          {

            id: product.id,

            name:

              product.name,

            option:

              optionName,

            price,

            cost,

            qty,

          },

        ];

      }

    );

  }

  function changeCartQty(

    index,

    quantity

  ) {

    const qty = Math.max(

      1,

      Number(quantity) || 1

    );

    setCart(

      (currentCart) =>

        currentCart.map(

          (item, itemIndex) =>

            itemIndex ===

            index

              ? {

                  ...item,

                  qty,

                }

              : item

        )

    );

  }

  function increaseQty(index) {

    setCart(

      (currentCart) =>

        currentCart.map(

          (item, itemIndex) =>

            itemIndex ===

            index

              ? {

                  ...item,

                  qty:

                    item.qty +

                    1,

                }

              : item

        )

    );

  }

  function decreaseQty(index) {

    setCart(

      (currentCart) =>

        currentCart

          .map(

            (

              item,

              itemIndex

            ) =>

              itemIndex ===

              index

                ? {

                    ...item,

                    qty:

                      item.qty -

                      1,

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

    setCart(

      (currentCart) =>

        currentCart.filter(

          (

            _,

            itemIndex

          ) =>

            itemIndex !==

            index

        )

    );

  }

  function completeSale() {

    if (

      cart.length === 0

    ) {

      return;

    }

    const soldByProduct =

      {};

    cart.forEach(

      (item) => {

        soldByProduct[
item.id

        ] =

          (soldByProduct[
item.id

          ] || 0) +

          Number(

            item.qty

          );

      }

    );

    const newInventory = {

      ...inventory,

    };

    Object.entries(

      soldByProduct

    ).forEach(

      ([

        productId,

        quantity,

      ]) => {

        newInventory[

          productId

        ] =

          Number(

            newInventory[

              productId

            ] ?? 50

          ) -

          Number(quantity);

      }

    );

    const saleItems =

      cart.map(

        (item) => {

          const qty =

            Number(

              item.qty

            );

          const unitPrice =

            Number(

              item.price

            );

          const unitCost =

            Number(

              item.cost || 0

            );

          const lineTotal =

            unitPrice *

            qty;

          const lineCost =

            unitCost *

            qty;

          return {

            productId:
item.id,

            productName:

              item.name,

            option:

              item.option,

            unitPrice,

            unitCost,

            quantity: qty,

            lineTotal,

            lineCost,

            lineProfit:

              lineTotal -

              lineCost,

          };

        }

      );

    const totalQty =

      saleItems.reduce(

        (sum, item) =>

          sum +

          item.quantity,

        0

      );

    const totalAmount =

      saleItems.reduce(

        (sum, item) =>

          sum +

          item.lineTotal,

        0

      );

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

      totalAmount,

      totalCost,

      totalProfit:

        totalAmount -

        totalCost,

      items: saleItems,

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

      `บันทึกบิลสำเร็จ\nยอดรวม ${totalAmount} บาท`

    );

  }

  function enterOwnerMode() {

    setOwnerMode(true);

    setLoginOpen(false);

    setPage(

      "dashboard"

    );

  }

  function exitOwnerMode() {

    setOwnerMode(false);

    setPage("pos");

  }

  function renderPage() {

    if (

      page ===

        "dashboard" &&

      ownerMode

    ) {

      return (
<DashboardPage />

      );

    }

    if (

      page ===

        "products" &&

      ownerMode

    ) {

      return (
<ProductManager

          products={

            products

          }

          inventory={

            inventory

          }

          onSaveProduct={

            saveProduct

          }

          onClose={() =>

            setPage("pos")

          }

        />

      );

    }

    if (

      page === "stock"

    ) {

      return (
<StockManager

          products={

            products

          }

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

    if (

      page === "reports"

    ) {

      return (
<div className="page">
<h1>

            รายงาน
</h1>
<p>

            กำลังพัฒนา
</p>
</div>

      );

    }

    if (

      page === "settings"

    ) {

      return (
<div className="page">
<h1>

            ตั้งค่า
</h1>
<p>

            กำลังพัฒนา
</p>
</div>

      );

    }

    return (
<POSPage

        products={

          products

        }

        inventory={

          inventory

        }

        cart={cart}

        onAddToCart={

          addToCart

        }

        onChangeCartQty={

          changeCartQty

        }

        onIncreaseQty={

          increaseQty

        }

        onDecreaseQty={

          decreaseQty

        }

        onRemoveItem={

          removeItem

        }

        onCompleteSale={

          completeSale

        }

      />

    );

  }

  return (
<>
<div className="app-shell">
<Sidebar

          currentPage={

            page

          }

          ownerMode={

            ownerMode

          }

          onChangePage={

            setPage

          }

          onOwnerLogin={() =>

            setLoginOpen(

              true

            )

          }

          onOwnerLogout={

            exitOwnerMode

          }

        />
<div className="app-content">

          {renderPage()}
</div>
</div>
<OwnerLogin

        open={

          loginOpen

        }

        onSuccess={

          enterOwnerMode

        }

        onClose={() =>

          setLoginOpen(

            false

          )

        }

      />
</>

  );

}

export default App;