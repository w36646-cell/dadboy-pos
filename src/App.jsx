import { useState } from "react";

import defaultProducts from "./data/products";

import StockManager from "./components/StockManager";

import ProductManager from "./components/ProductManager";

import OwnerLogin from "./components/OwnerLogin";

import OwnerSidebar from "./components/OwnerSidebar";

import PaymentPopup from "./components/PaymentPopup";

import POSPage from "./pages/POSPage";

import DashboardPage from "./pages/DashboardPage";

import ReportPage from "./pages/ReportPage";

import BillsPage from "./pages/BillsPage";

import createBillId from "./utils/createBillId";

import "./styles/App.css";

import "./components/PaymentPopup.css";

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

  const initialProducts = loadProducts();

  const [products, setProducts] =

    useState(initialProducts);

  const [inventory, setInventory] =

    useState(() =>

      loadInventory(initialProducts)

    );

  const [cart, setCart] =

    useState([]);

  const [page, setPage] =

    useState("pos");

  const [ownerMode, setOwnerMode] =

    useState(false);

  const [loginOpen, setLoginOpen] =

    useState(false);

  const [paymentOpen, setPaymentOpen] =

    useState(false);

  function saveProducts(

    newProducts

  ) {

    setProducts(newProducts);

    localStorage.setItem(

      PRODUCTS_KEY,

      JSON.stringify(newProducts)

    );

  }

  function saveProduct(

    updatedProduct

  ) {

    const newProducts =

      products.map((product) =>
product.id === updatedProduct.id

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

      JSON.stringify(newInventory)

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

    const price = Number(

      option?.price ??

        product.price ??

        0

    );

    const optionName =

      option?.name || "ปกติ";

    const cost = Number(

      product.cost || 0

    );

    setCart((currentCart) => {

      const found =

        currentCart.find(

          (item) =>
item.id === product.id &&

            item.option === optionName

        );

      if (found) {

        return currentCart.map(

          (item) =>
item.id === product.id &&

            item.option === optionName

              ? {

                  ...item,

                  name:

                    product.name,

                  price,

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

          id: product.id,

          name: product.name,

          option: optionName,

          price,

          cost,

          qty: safeQty,

        },

      ];

    });

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

                  Number(

                    item.qty

                  ) + 1,

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

                    Number(

                      item.qty

                    ) - 1,

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

        sum +

        Number(item.qty || 0),

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

  function openPayment() {

    if (cart.length === 0) {

      return;

    }

    setPaymentOpen(true);

  }

  function closePayment() {

    setPaymentOpen(false);

  }

  function completeSale() {

    if (cart.length === 0) {

      setPaymentOpen(false);

      return;

    }

    const soldByProduct = {};

    cart.forEach((item) => {

      soldByProduct[item.id] =

        (soldByProduct[item.id] || 0) +

        Number(item.qty || 0);

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

        const quantity =

          Number(item.qty || 0);

        const unitPrice =

          Number(

            item.price || 0

          );

        const unitCost =

          Number(

            item.cost || 0

          );

        const lineTotal =

          unitPrice * quantity;

        const lineCost =

          unitCost * quantity;

        return {

          productId: item.id,

          productName:

            item.name,

          option:

            item.option,

          unitPrice,

          unitCost,

          quantity,

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

          Number(

            item.lineCost || 0

          ),

        0

      );

    const now =

      new Date();

    const sale = {

      billId:

        createBillId(),

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

        total -

        totalCost,

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

    setPaymentOpen(false);

    window.alert(

      `ขายสำเร็จ\nเลขบิล ${sale.billId}\nยอดรวม ${total.toLocaleString()} บาท`

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
<POSPage

        products={products}

        inventory={inventory}

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

        onOpenPayment={

          openPayment

        }

      />

    );

  }

  function renderOwnerPage() {

    if (

      page === "dashboard"

    ) {

      return (
<DashboardPage />

      );

    }

    if (

      page === "reports"

    ) {

      return (
<ReportPage />

      );

    }

    if (

      page === "bills"

    ) {

      return (
<BillsPage />

      );

    }

    if (

      page === "products"

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

      page === "settings"

    ) {

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
<>
<div className="employee-pos-topbar">
<strong>

              Dadboy POS
</strong>
<div>
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
</div>

          {renderPOS()}
</>

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
<PaymentPopup

        open={paymentOpen}

        total={total}

        onConfirm={

          completeSale

        }

        onClose={

          closePayment

        }

      />
</>

  );

}

export default App;