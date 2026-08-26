import {

  useEffect,

  useState,

} from "react";

import defaultProducts from "./data/products";

import StockManager from "./components/StockManager";

import StockAdjustment from "./components/StockAdjustment";

import ProductManager from "./components/ProductManager";

import OwnerLogin from "./components/OwnerLogin";

import OwnerSidebar from "./components/OwnerSidebar";

import PaymentPopup from "./components/PaymentPopup";

import POSPage from "./pages/POSPage";

import SyncStatus from "./components/pos/SyncStatus";
 
import DashboardPage from "./pages/DashboardPage";

import ReportPage from "./pages/ReportPage";

import BillsPage from "./pages/BillsPage";

import createBillId from "./utils/createBillId";

import {

  getCloudProducts,

  saveCloudProduct,

  uploadProductsToCloud,

  updateCloudStock,

  updateSoldCloudStocks,

} from "./services/productService";

import {

  saveCloudSale,

  getCloudTodaySales,

} from "./services/salesService";

import {

  saveStockAdjustment,

} from "./services/stockAdjustmentService";

import "./styles/App.css";

import "./components/PaymentPopup.css";

const STOCK_KEY =

  "dadboy_inventory_v2";

const SALES_KEY =

  "dadboy_sales_v1";

const PRODUCTS_KEY =

  "dadboy_products_v1";

const CART_KEY =

  "dadboy_active_cart_v1";

const CART_MERGE_WINDOW_MS =

  2 * 60 * 1000; 

const PENDING_STOCK_KEY =

  "dadboy_pending_stock_sync_v2";

const PENDING_SALES_KEY =

  "dadboy_pending_sales_sync_v2";

const PENDING_ADJUSTMENTS_KEY =

  "dadboy_pending_stock_adjustments_v1";

function readStorage(

  key,

  fallback

) {

  try {

    const saved =

      localStorage.getItem(

        key

      );

    return saved

      ? JSON.parse(saved)

      : fallback;

  } catch {

    return fallback;

  }

}

function loadProducts() {

  const saved =

    readStorage(

      PRODUCTS_KEY,

      null

    );

  return Array.isArray(saved)

    ? saved

    : defaultProducts;

}

function loadInventory(

  productList

) {

  const saved =

    readStorage(

      STOCK_KEY,

      null

    );

  if (

    saved &&

    typeof saved ===

      "object"

  ) {

    return saved;

  }

  const result = {};

  productList.forEach(

    (product) => {

      result[
product.id

      ] =

        Number(

          product.stock ??

            50

        );

    }

  );

  return result;

}

function inventoryFromProducts(

  productList

) {

  const result = {};

  productList.forEach(

    (product) => {

      result[
product.id

      ] =

        Number(

          product.stock ??

            0

        );

    }

  );

  return result;

}

/* =========================

   Pending Sales

========================= */

function getPendingSales() {

  const result =

    readStorage(

      PENDING_SALES_KEY,

      []

    );

  return Array.isArray(

    result

  )

    ? result

    : [];

}

function savePendingSale(

  sale

) {

  const current =

    getPendingSales();

  const withoutOld =

    current.filter(

      (item) =>

        item.billId !==

        sale.billId

    );

  localStorage.setItem(

    PENDING_SALES_KEY,

    JSON.stringify([

      ...withoutOld,

      sale,

    ])

  );

}

function removePendingSale(

  billId

) {

  const remaining =

    getPendingSales()

      .filter(

        (item) =>

          item.billId !==

          billId

      );

  localStorage.setItem(

    PENDING_SALES_KEY,

    JSON.stringify(

      remaining

    )

  );

}

/* =========================

   Pending Stock

========================= */

function getPendingStocks() {

  const result =

    readStorage(

      PENDING_STOCK_KEY,

      {}

    );

  if (

    result &&

    typeof result ===

      "object" &&

    !Array.isArray(result)

  ) {

    return result;

  }

  return {};

}

function savePendingStock(

  productId,

  stock

) {

  const current =

    getPendingStocks();

  try {

    localStorage.setItem(

      PENDING_STOCK_KEY,

      JSON.stringify({

        ...current,

        [String(productId)]:

          Number(stock),

      })

    );

    return true;

  } catch (error) {

    console.warn(

      "Pending stock local save skipped:",

      error

    );

    return false;

  }

}
 
function removePendingStock(

  productId

) {

  const current =

    getPendingStocks();

  delete current[

    String(productId)

  ];

  localStorage.setItem(

    PENDING_STOCK_KEY,

    JSON.stringify(

      current

    )

  );

}

function pendingStocksCount() {

  return Object.keys(

    getPendingStocks()

  ).length;

}

/* =========================

   Pending Stock Adjustments

========================= */

function getPendingAdjustments() {

  const result =

    readStorage(

      PENDING_ADJUSTMENTS_KEY,

      []

    );

  return Array.isArray(

    result

  )

    ? result

    : [];

}

function adjustmentKey(

  adjustment

) {

  return [

    String(

      adjustment.productId

    ),

    String(

      adjustment.adjustedAt

    ),

  ].join("|");

}

function savePendingAdjustment(

  adjustment

) {

  const current =

    getPendingAdjustments();

  const key =

    adjustmentKey(

      adjustment

    );

  const withoutOld =

    current.filter(

      (item) =>

        adjustmentKey(

          item

        ) !== key

    );

  localStorage.setItem(

    PENDING_ADJUSTMENTS_KEY,

    JSON.stringify([

      ...withoutOld,

      adjustment,

    ])

  );

}

function removePendingAdjustment(

  adjustment

) {

  const key =

    adjustmentKey(

      adjustment

    );

  const remaining =

    getPendingAdjustments()

      .filter(

        (item) =>

          adjustmentKey(

            item

          ) !== key

      );

  localStorage.setItem(

    PENDING_ADJUSTMENTS_KEY,

    JSON.stringify(

      remaining

    )

  );

}

function pendingAdjustmentsCount() {

  return getPendingAdjustments()

    .length;

}


/*

  ยอดขายรายวันหน้า POS

  นับยอดขายของวันนั้นทั้งหมด:

  00:00 - 24:00

*/

function isSaleInDailyWindow(

  sale,

  targetDate

) {

  if (

    !sale ||

    sale.soldDate !==

      targetDate

  ) {

    return false;

  }

  return true;

}
 
function App() {

  const initialProducts =

    loadProducts();

  const [

    products,

    setProducts,

  ] = useState(

    initialProducts

  );

  const [

    inventory,

    setInventory,

  ] = useState(() =>

    loadInventory(

      initialProducts

    )

  );

const [

  cart,

  setCart,

] = useState(() => {

  const savedCart =

    readStorage(

      CART_KEY,

      []

    );

  return Array.isArray(savedCart)

    ? savedCart

    : [];

});
 
  const [

    page,

    setPage,

  ] = useState("pos");

  const [

    ownerMode,

    setOwnerMode,

  ] = useState(false);

  const [

    loginOpen,

    setLoginOpen,

  ] = useState(false);

  const [

    paymentOpen,

    setPaymentOpen,

  ] = useState(false);

  const [

    cloudReady,

    setCloudReady,

  ] = useState(false);

 const [

  headerSales,

  setHeaderSales,

] = useState(() => {

  /*

    Local เก็บเฉพาะบิลที่ยังรอ Sync

    ประวัติบิลจริงอ่านจาก Cloud

  */

  return getPendingSales();

});
  
  const [

    syncVersion,

    setSyncVersion,

  ] = useState(0);

  const [

    isOnline,

    setIsOnline,

  ] = useState(() =>

    typeof navigator ===

    "undefined"

      ? true

      : navigator.onLine

  );

  useEffect(() => {

  localStorage.setItem(

    CART_KEY,

    JSON.stringify(cart)

  );

}, [cart]);
  
/*

  โหลดเฉพาะยอดขายวันนี้

  ช่วงเวลา:

  00:00 - 24:00

  โหลดเมื่อ:

  - เปิด/Refresh หน้า

  - ทุก 10 นาที

  - หลังขายสำเร็จ

*/

async function refreshHeaderSales() {

  if (

    typeof navigator !==

      "undefined" &&

    navigator.onLine ===

      false

  ) {

    return;

  }

  const start =

    new Date();

  start.setHours(

    0,

    0,

    0,

    0

  );

  const end =

    new Date(start);

  end.setDate(

    end.getDate() + 1

  );

  end.setHours(

    0,

    0,

    0,

    0

  );

  const todayDate =

    start.toLocaleDateString(

      "en-CA"

    );

  try {

    const cloudSales =

      await getCloudTodaySales(

        start.toISOString(),

        end.toISOString()

      );

    const mergedSales =

      new Map();

    (

      Array.isArray(

        cloudSales

      )

        ? cloudSales

        : []

    ).forEach(

      (sale) => {

        if (

          sale?.billId

        ) {

          mergedSales.set(

            sale.billId,

            sale

          );

        }

      }

    );

    /*

      รวมเฉพาะบิล Offline/Pending

      ของวันนี้

    */

    getPendingSales()

      .filter(

        (sale) =>

          isSaleInDailyWindow(

            sale,

            todayDate

          )

      )

      .forEach(

        (sale) => {

          if (

            sale?.billId &&

            !mergedSales.has(

              sale.billId

            )

          ) {

            mergedSales.set(

              sale.billId,

              sale

            );

          }

        }

      );

    setHeaderSales(

      Array.from(

        mergedSales.values()

      )

    );

    /*

      ล้าง cache ประวัติบิลรุ่นเก่า

    */

    try {

      localStorage.removeItem(

        SALES_KEY

      );

    } catch (error) {

      console.warn(

        "Old sales cache cleanup skipped:",

        error

      );

    }

  } catch (error) {

    console.error(

      "Header sales sync error:",

      error

    );

  }

}


useEffect(() => {

  /*

    Refresh หน้า / เปิด App

  */

  refreshHeaderSales();

  /*

    โหลดใหม่ทุก 10 นาที

  */

  const timer =

    window.setInterval(

      refreshHeaderSales,

      600000

    );

  return () => {

    window.clearInterval(

      timer

    );

  };

}, []);
 
  function notifySyncStateChanged() {

    setSyncVersion(

      (current) =>

        current + 1

    );

  }

  function isSyncClean() {

    return (

      pendingStocksCount() ===

        0 &&

      getPendingSales()

        .length === 0 &&

      pendingAdjustmentsCount() ===

        0

    );

  }

  /* =========================

     Pending Sync

  ========================= */

  async function retryPendingStocks() {

    const entries =

      Object.entries(

        getPendingStocks()

      );

    if (

      entries.length === 0

    ) {

      return true;

    }

    let allSuccess =

      true;

    for (

      const [

        productId,

        stock,

      ] of entries

    ) {

      try {

        await updateCloudStock(

          productId,

          stock

        );

        removePendingStock(

          productId

        );

      } catch (error) {

        allSuccess =

          false;

        console.error(

          "Pending stock sync error:",

          productId,

          error

        );

      }

    }

    notifySyncStateChanged();

    return allSuccess;

  }

  async function retryPendingSales() {

    const pendingSales =

      getPendingSales();

    if (

      pendingSales.length ===

      0

    ) {

      return true;

    }

    let allSuccess =

      true;

    for (

      const sale of

      pendingSales

    ) {

      try {

        await saveCloudSale(

          sale

        );

        removePendingSale(

          sale.billId

        );

      } catch (error) {

        allSuccess =

          false;

        console.error(

          "Pending sale sync error:",

          sale.billId,

          error

        );

      }

    }

    notifySyncStateChanged();

    return allSuccess;

  }

  async function retryPendingAdjustments() {

    const pending =

      getPendingAdjustments();

    if (

      pending.length === 0

    ) {

      return true;

    }

    let allSuccess =

      true;

    for (

      const adjustment of

      pending

    ) {

      try {

        await saveStockAdjustment(

          adjustment

        );

        removePendingAdjustment(

          adjustment

        );

      } catch (error) {

        allSuccess =

          false;

        console.error(

          "Pending adjustment sync error:",

          adjustment,

          error

        );

      }

    }

    notifySyncStateChanged();

    return allSuccess;

  }

  async function retryAllPending() {

    if (

      typeof navigator !==

        "undefined" &&

      navigator.onLine ===

        false

    ) {

      setCloudReady(

        false

      );

      return false;

    }

    const [

      stockOk,

      salesOk,

      adjustmentOk,

    ] =

      await Promise.all([

        retryPendingStocks(),

        retryPendingSales(),

        retryPendingAdjustments(),

      ]);

    const clean =

      isSyncClean();

    setCloudReady(

      stockOk &&

        salesOk &&

        adjustmentOk &&

        clean

    );

    return clean;

  }

  /* =========================

     Startup / Online Sync

  ========================= */

  useEffect(() => {

    let cancelled =

      false;

    let syncing =

      false;

    async function runSync() {

      if (syncing) {

        return;

      }

      if (

        typeof navigator !==

          "undefined" &&

        navigator.onLine ===

          false

      ) {

        setCloudReady(

          false

        );

        return;

      }

      syncing = true;

      try {

        await retryAllPending();

      } finally {

        syncing = false;

      }

    }

    async function startCloud() {

      try {

        await runSync();

        const cloudProducts =

          await getCloudProducts();

        if (cancelled) {

          return;

        }

        if (

          Array.isArray(

            cloudProducts

          ) &&

          cloudProducts.length >

            0

        ) {

          const cloudInventory =

            inventoryFromProducts(

              cloudProducts

            );

          const pendingStocks =

            getPendingStocks();

          Object.entries(

            pendingStocks

          ).forEach(

            ([

              productId,

              stock,

            ]) => {

              cloudInventory[

                productId

              ] =

                Number(stock);

            }

          );

          setProducts(

            cloudProducts

          );

          setInventory(

            cloudInventory

          );

          localStorage.setItem(

            PRODUCTS_KEY,

            JSON.stringify(

              cloudProducts

            )

          );

          localStorage.setItem(

            STOCK_KEY,

            JSON.stringify(

              cloudInventory

            )

          );

          setCloudReady(

            isSyncClean()

          );

          return;

        }

        const localInventory =

          readStorage(

            STOCK_KEY,

            inventory

          );

        const uploaded =

          await uploadProductsToCloud(

            initialProducts,

            localInventory

          );

        if (cancelled) {

          return;

        }

        const uploadedInventory =

          inventoryFromProducts(

            uploaded

          );

        setProducts(

          uploaded

        );

        setInventory(

          uploadedInventory

        );

        localStorage.setItem(

          PRODUCTS_KEY,

          JSON.stringify(

            uploaded

          )

        );

        localStorage.setItem(

          STOCK_KEY,

          JSON.stringify(

            uploadedInventory

          )

        );

        setCloudReady(

          true

        );

      } catch (error) {

        console.error(

          "Supabase startup error:",

          error

        );

        setCloudReady(

          false

        );

      }

    }

    function handleOnline() {

      setIsOnline(

        true

      );

      runSync();

    }

    function handleOffline() {

      setIsOnline(

        false

      );

      setCloudReady(

        false

      );

    }

    function handleFocus() {

      const online =

        typeof navigator ===

        "undefined"

          ? true

          : navigator.onLine;

      setIsOnline(

        online

      );

      if (online) {

        runSync();

      }

    }

    setIsOnline(

      typeof navigator ===

        "undefined"

        ? true

        : navigator.onLine

    );

    startCloud();

    window.addEventListener(

      "online",

      handleOnline

    );

    window.addEventListener(

      "offline",

      handleOffline

    );

    window.addEventListener(

      "focus",

      handleFocus

    );

    const syncTimer =

      setInterval(

        () => {

          if (

            typeof navigator ===

              "undefined" ||

            navigator.onLine

          ) {

            runSync();

          }

        },

        15000

      );

    return () => {

      cancelled = true;

      clearInterval(

        syncTimer

      );

      window.removeEventListener(

        "online",

        handleOnline

      );

      window.removeEventListener(

        "offline",

        handleOffline

      );

      window.removeEventListener(

        "focus",

        handleFocus

      );

    };

  }, []);

  /* =========================

     Products

  ========================= */

  function saveProducts(newProducts) {

  setProducts(newProducts);

  try {

    localStorage.setItem(

      PRODUCTS_KEY,

      JSON.stringify(newProducts)

    );

  } catch (error) {

    console.warn(

      "Product local cache skipped:",

      error

    );

  }

}
 
  async function saveProduct(

    updatedProduct

  ) {

    const oldProducts =

      products;

    const newProducts =

      products.map(

        (product) =>
product.id ===
updatedProduct.id

            ? updatedProduct

            : product

      );

    saveProducts(

      newProducts

    );

    try {

      const cloudProduct =

        await saveCloudProduct(

          updatedProduct,

          inventory[
updatedProduct.id

          ]

        );

      const syncedProducts =

        newProducts.map(

          (product) =>
product.id ===
cloudProduct.id

              ? {

                  ...product,

                  ...cloudProduct,

                }

              : product

        );

      saveProducts(

        syncedProducts

      );

      setCloudReady(

        isSyncClean()

      );

    } catch (error) {

      console.error(

        "Supabase save product error:",

        error

      );

      saveProducts(

        oldProducts

      );

      setCloudReady(

        false

      );

      window.alert(

        "บันทึกสินค้าเข้า Cloud ไม่สำเร็จ\nข้อมูลถูกคืนค่าเดิมแล้ว"

      );

    }

  }

  /* =========================

     Inventory

  ========================= */

  function saveInventoryLocal(

  newInventory

) {

  setInventory(

    newInventory

  );

  try {

    localStorage.setItem(

      STOCK_KEY,

      JSON.stringify(

        newInventory

      )

    );

  } catch (error) {

    console.warn(

      "Inventory local cache skipped:",

      error

    );

  }

}
 
  function getStock(

    productId

  ) {

    return Number(

      inventory[

        productId

      ] ?? 0

    );

  }

  function addStock(

    productId,

    quantity

  ) {

    const safeQty =

      Number(quantity);

    if (

      !Number.isFinite(

        safeQty

      ) ||

      safeQty <= 0

    ) {

      return;

    }

    const newStock =

      getStock(

        productId

      ) +

      safeQty;

    const newInventory = {

      ...inventory,

      [productId]:

        newStock,

    };

    saveInventoryLocal(

      newInventory

    );

    const pendingSaved =

  savePendingStock(

    productId,

    newStock

  );

if (!pendingSaved) {

  console.warn(

    "Stock pending could not be saved locally"

  );

}

notifySyncStateChanged();

updateCloudStock(
 
      productId,

      newStock

    )

      .then(() => {

        removePendingStock(

          productId

        );

        notifySyncStateChanged();

        setCloudReady(

          isSyncClean()

        );

      })

      .catch(

        (error) => {

          console.error(

            "Supabase stock background error:",

            error

          );

          setCloudReady(

            false

          );

        }

      );

  }

  /*

    ปรับ Stock จากการตรวจนับ

    local เปลี่ยนก่อน

    แล้ว Cloud ทำงานเบื้องหลัง

    Offline:

    - stock pending

    - adjustment pending

    Online:

    - update products.stock

    - insert stock_adjustments

  */

  function adjustStock(

    adjustment

  ) {

    const productId =

      adjustment?.productId;

    const actualStock =

      Number(

        adjustment?.actualStock

      );

    if (

      productId ===

        undefined ||

      productId ===

        null ||

      !Number.isFinite(

        actualStock

      ) ||

      actualStock < 0

    ) {

      window.alert(

        "ข้อมูลปรับสต๊อกไม่ถูกต้อง"

      );

      return;

    }

    const normalizedAdjustment = {

      ...adjustment,

      productId,

      previousStock:

        Number(

          adjustment.previousStock

        ),

      actualStock,

      difference:

        actualStock -

        Number(

          adjustment.previousStock

        ),

      adjustedAt:

        adjustment.adjustedAt ||

        new Date()

          .toISOString(),

    };

    const newInventory = {

      ...inventory,

      [productId]:

        actualStock,

    };

    /*

      Save local ก่อน

    */

    saveInventoryLocal(

      newInventory

    );

    savePendingStock(

      productId,

      actualStock

    );

    savePendingAdjustment(

      normalizedAdjustment

    );

    notifySyncStateChanged();

    /*

      ถ้า Offline

      จบแค่นี้ก่อน

      รอระบบ Sync

    */

    if (

      typeof navigator !==

        "undefined" &&

      navigator.onLine ===

        false

    ) {

      setCloudReady(

        false

      );

      window.alert(

        "ปรับสต๊อกเรียบร้อย\nข้อมูลจะ Sync เมื่อกลับมาออนไลน์"

      );

      return;

    }

    const stockJob =

      updateCloudStock(

        productId,

        actualStock

      )

        .then(() => {

          removePendingStock(

            productId

          );

          return true;

        })

        .catch(

          (error) => {

            console.error(

              "Stock adjustment stock sync error:",

              error

            );

            return false;

          }

        );

    const adjustmentJob =

      saveStockAdjustment(

        normalizedAdjustment

      )

        .then(() => {

          removePendingAdjustment(

            normalizedAdjustment

          );

          return true;

        })

        .catch(

          (error) => {

            console.error(

              "Stock adjustment history sync error:",

              error

            );

            return false;

          }

        );

    Promise.all([

      stockJob,

      adjustmentJob,

    ]).then(

      ([

        stockOk,

        adjustmentOk,

      ]) => {

        notifySyncStateChanged();

        setCloudReady(

          stockOk &&

            adjustmentOk &&

            isSyncClean()

        );

        if (

          stockOk &&

          adjustmentOk

        ) {

          window.alert(

            "ปรับสต๊อกและบันทึกประวัติเรียบร้อย"

          );

        } else {

          window.alert(

            "ปรับสต๊อกในเครื่องแล้ว\nมีข้อมูลบางส่วนรอ Sync"

          );

        }

      }

    );

  }

  /* =========================

     Cart Helpers

  ========================= */

  function findProduct(

    productId

  ) {

    return products.find(

      (product) =>

        String(
product.id

        ) ===

        String(

          productId

        )

    );

  }

  function getStockPerUnit(

    item

  ) {

    const product =

      findProduct(
item.id

      );

    const optionName =

      String(

        item.option || ""

      );

    const looksLikePack =

      item.saleType ===

        "pack" ||

      optionName.startsWith(

        "แพ็ก"

      );

    if (

      looksLikePack

    ) {

      const productPackQty =

        Number(

          product?.packQty ||

            0

        );

      if (

        Number.isFinite(

          productPackQty

        ) &&

        productPackQty >= 2

      ) {

        return productPackQty;

      }

      const cartPackQty =

        Number(

          item.stockPerUnit ||

            0

        );

      if (

        Number.isFinite(

          cartPackQty

        ) &&

        cartPackQty >= 2

      ) {

        return cartPackQty;

      }

    }

    return 1;

  }

  function addToCart(

    product,

    option,

    quantity = 1

  ) {

    const safeQty =

      Math.max(

        1,

        Number(

          quantity

        ) || 1

      );

    const price =

      Number(

        option?.price ??

          product.price ??

          0

      );

    const optionName =

      option?.name ||

      "ปกติ";

    const isPack =

      option?.saleType ===

        "pack" ||

      String(

        optionName

      ).startsWith(

        "แพ็ก"

      );

    const saleType =

      isPack

        ? "pack"

        : "unit";

    const stockPerUnit =

      isPack

        ? Math.max(

            2,

            Number(

              product.packQty ??

                option?.stockPerUnit ??

                2

            ) || 2

          )

        : 1;

   const baseCost =

      Number(

        product.cost || 0

      );

    const defaultExtraCost =

      option?.id === "cup"

        ? 4

        : option?.id === "ownCup"

          ? 2

          : 0;

    const extraCost =

      Math.max(

        0,

        Number(

          option?.extraCost ??

            defaultExtraCost

        ) || 0

      );

    const cost =

      baseCost + extraCost;
 
    setCart(

      (currentCart) => {

        const now =

          Date.now();

        let mergeIndex =

          -1;

        /*

          ไล่จากบรรทัดล่าสุดย้อนขึ้นไป

          สินค้าจะรวมกันเมื่อ:

          - Product เดียวกัน

          - ตัวเลือกเดียวกัน

          - แบบขายเดียวกัน

          - เพิ่มล่าสุดไม่เกิน 2 นาที

        */

        for (

          let index =

            currentCart.length - 1;

          index >= 0;

          index -= 1

        ) {

          const item =

            currentCart[index];

          const sameItem =

            String(
item.id

            ) ===

              String(
product.id

              ) &&

            item.option ===

              optionName &&

            item.saleType ===

              saleType;

          if (

            !sameItem

          ) {

            continue;

          }

          const lastAddedAt =

            Number(

              item.lastAddedAt || 0

            );

          const withinWindow =

            lastAddedAt > 0 &&

            now -

              lastAddedAt <=

              CART_MERGE_WINDOW_MS;

          if (

            withinWindow

          ) {

            mergeIndex =

              index;

            break;

          }

        }

        /*

          เจอบรรทัดเดียวกันภายใน 2 นาที

          เพิ่มจำนวนเฉพาะบรรทัดนั้น

        */

        if (

          mergeIndex >= 0

        ) {

          return currentCart.map(

            (

              item,

              itemIndex

            ) =>

              itemIndex ===

              mergeIndex

                ? {

                    ...item,

                    name:

                      product.name,

                    price,

                    cost,

                    saleType,

                    stockPerUnit,

                    qty:

                      Number(

                        item.qty

                      ) +

                      safeQty,

                    lastAddedAt:

                      now,

                  }

                : item

          );

        }

        /*

          ไม่มีบรรทัดล่าสุด

          หรือบรรทัดเดิมเกิน 2 นาทีแล้ว

          สร้างบรรทัดใหม่

        */

        return [

          ...currentCart,

          {

            cartLineId:

              `${String(
product.id

              )}-${now}-${Math.random()

                .toString(36)

                .slice(2, 8)}`,

            id:
product.id,

            name:

              product.name,

            option:

              optionName,

            price,

            cost,

            qty:

              safeQty,

            saleType,

            stockPerUnit,

            lastAddedAt:

              now,

          },

        ];

      }

    );

  }
 
  function changeCartQty(

    index,

    quantity

  ) {

    const safeQty =

      Math.max(

        1,

        Number(

          quantity

        ) || 1

      );

    setCart(

      (currentCart) =>

        currentCart.map(

          (

            item,

            itemIndex

          ) =>

            itemIndex ===

            index

              ? {

                  ...item,

                  qty:

                    safeQty,

                }

              : item

        )

    );

  }

  function increaseQty(

    index

  ) {

    setCart(

      (currentCart) =>

        currentCart.map(

          (

            item,

            itemIndex

          ) =>

            itemIndex ===

            index

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

  function decreaseQty(

    index

  ) {

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

  function removeItem(

    index

  ) {

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

  /* =========================

     Payment

  ========================= */

  function openPayment() {

    if (

      cart.length === 0

    ) {

      return;

    }

    setPaymentOpen(

      true

    );

  }

  function closePayment() {

    setPaymentOpen(

      false

    );

  }

  function completeSale() {

    if (

      cart.length === 0

    ) {

      setPaymentOpen(

        false

      );

      return;

    }

    const checkoutCart =

      [...cart];

    const checkoutTotal =

      total;

    const checkoutStockQty =

      checkoutCart.reduce(

        (

          sum,

          item

        ) => {

          const quantity =

            Number(

              item.qty || 0

            );

          const stockPerUnit =

            getStockPerUnit(

              item

            );

          return (

            sum +

            quantity *

              stockPerUnit

          );

        },

        0

      );

    const soldByProduct =

      {};

    checkoutCart.forEach(

      (item) => {

        const quantity =

          Number(

            item.qty || 0

          );

        const stockPerUnit =

          getStockPerUnit(

            item

          );

        const stockQuantity =

          quantity *

          stockPerUnit;

        soldByProduct[
item.id

        ] =

          Number(

            soldByProduct[
item.id

            ] || 0

          ) +

          stockQuantity;

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

        stockQuantity,

      ]) => {

        newInventory[

          productId

        ] =

          Number(

            newInventory[

              productId

            ] ?? 0

          ) -

          Number(

            stockQuantity

          );

      }

    );

    const saleItems =

      checkoutCart.map(

        (item) => {

          const quantity =

            Number(

              item.qty || 0

            );

          const stockPerUnit =

            getStockPerUnit(

              item

            );

          const stockQuantity =

            quantity *

            stockPerUnit;

          const unitPrice =

            Number(

              item.price || 0

            );

          const costPerPiece =

            Number(

              item.cost || 0

            );

          const unitCost =

            costPerPiece *

            stockPerUnit;

          const lineTotal =

            unitPrice *

            quantity;

          const lineCost =

            costPerPiece *

            stockQuantity;

          const saleType =

            stockPerUnit > 1

              ? "pack"

              : "unit";

          return {

            productId:
item.id,

            productName:

              item.name,

            option:

              item.option,

            saleType,

            stockPerUnit,

            stockQuantity,

            unitPrice,

            unitCost,

            quantity,

            lineTotal,

            lineCost,

            lineProfit:

              lineTotal -

              lineCost,

          };

        }

      );

    const totalCost =

      saleItems.reduce(

        (sum, item) =>

          sum +

          Number(

            item.lineCost ||

              0

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

      totalQty:

        checkoutStockQty,

      totalAmount:

        checkoutTotal,

      totalCost,

      totalProfit:

        checkoutTotal -

        totalCost,

      items:

        saleItems,

    };


    
    setHeaderSales(

      (currentSales) => {

        const safeSales =

          Array.isArray(

            currentSales

          )

            ? currentSales

            : [];

        return [

          ...safeSales.filter(

            (item) =>

              item.billId !==

              sale.billId

          ),

          sale,

        ];

      }

    );
 
    saveInventoryLocal(

      newInventory

    );

    savePendingSale(

      sale

    );

    Object.keys(

      soldByProduct

    ).forEach(

      (productId) => {

        savePendingStock(

          productId,

          newInventory[

            productId

          ]

        );

      }

    );

    notifySyncStateChanged();

    setCart([]);

    setPaymentOpen(

      false

    );

    window.alert(

      `ขายสำเร็จ\nเลขบิล ${sale.billId}\nยอดรวม ${checkoutTotal.toLocaleString()} บาท`

    );

    const stockJob =

      updateSoldCloudStocks(

        soldByProduct,

        newInventory

      )

        .then(() => {

          Object.keys(

            soldByProduct

          ).forEach(

            (productId) => {

              removePendingStock(

                productId

              );

            }

          );

          notifySyncStateChanged();

          return true;

        })

        .catch(

          (error) => {

            console.error(

              "Supabase stock sync error:",

              error

            );

            setCloudReady(

              false

            );

            return false;

          }

        );

   const saleJob =

      saveCloudSale(

        sale

      )

        .then(() => {

          removePendingSale(

            sale.billId

          );

          notifySyncStateChanged();

          /*

            หลังคิดเงินและบิลขึ้น Cloud แล้ว

            โหลดยอดขายวันนี้ใหม่ทันที

          */

          refreshHeaderSales();

          return true;

        })

        .catch(

          (error) => {

            console.error(

              "Supabase sale sync error:",

              error

            );

            setCloudReady(

              false

            );

            return false;

          }

        );

    Promise.all([

      stockJob,

      saleJob,

    ]).then(

      ([

        stockOk,

        saleOk,

      ]) => {

        setCloudReady(

          stockOk &&

            saleOk &&

            isSyncClean()

        );

      }

    );

  }

  /* =========================

     Owner Mode

  ========================= */

  function enterOwnerMode() {

    setOwnerMode(

      true

    );

    setLoginOpen(

      false

    );

    setPage(

      "dashboard"

    );

  }

  function exitOwnerMode() {

    setOwnerMode(

      false

    );

    setPage(

      "pos"

    );

  }

  const todayDate =

  new Date().toLocaleDateString(

    "en-CA"

  );

const todaySales =

  headerSales.filter(

    (sale) =>

      isSaleInDailyWindow(

        sale,

        todayDate

      )

  );
 
const todaySoldQty =

  todaySales.reduce(

    (sum, sale) =>

      sum +

      Number(

        sale.totalQty || 0

      ),

    0

  );

const todaySalesAmount =

  todaySales.reduce(

    (sum, sale) =>

      sum +

      Number(

        sale.totalAmount || 0

      ),

    0

  );
 

  const pendingSaleCount =

    getPendingSales()

      .length;

  const pendingStockCount =

    pendingStocksCount();

  const pendingAdjustmentCount =

    pendingAdjustmentsCount();

  void syncVersion;

  /* =========================

     Render POS

  ========================= */

  function renderPOS() {

    return (
<POSPage

        products={

          products

        }

        inventory={

          inventory

        }

        cart={

          cart

        }

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

       todaySoldQty={

         todaySoldQty

        }

       todaySalesAmount={

   todaySalesAmount

}
 
      />

    );

  }

  /* =========================

     Render Owner Pages

  ========================= */

  function renderOwnerPage() {

    if (

      page ===

      "dashboard"

    ) {

      return (
<DashboardPage

          onOpenStock={() =>

            setPage(

              "stock"

            )

          }

        />

      );

    }

    if (

      page ===

      "reports"

    ) {

      return (
<ReportPage />

      );

    }

    if (

      page ===

      "bills"

    ) {

      return (
<BillsPage

          onInventoryUpdated={

            saveInventoryLocal

          }

        />

      );

    }

    if (

      page ===

      "products"

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

            setPage(

              "pos"

            )

          }

        />

      );

    }

    if (

      page ===

      "stock"

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

            setPage(

              "pos"

            )

          }

        />

      );

    }

    if (

      page ===

      "stock-adjustment"

    ) {

      return (
<StockAdjustment

          products={

            products

          }

          inventory={

            inventory

          }

          onAdjustStock={

            adjustStock

          }

          onClose={() =>

            setPage(

              "pos"

            )

          }

        />

      );

    }

    if (

      page ===

      "settings"

    ) {

      return (
<div className="owner-placeholder-page">
<h1>

            ตั้งค่า
</h1>
<p>

            Internet:{" "}

            {isOnline

              ? "ออนไลน์"

              : "ออฟไลน์"}
</p>
<p>

            Cloud:{" "}

            {cloudReady

              ? "Sync เรียบร้อย"

              : "มีข้อมูลรอ Sync"}
</p>
<p>

            บิลรอ Sync:{" "}

            {

              pendingSaleCount

            }{" "}

            บิล
</p>
<p>

            Stock รอ Sync:{" "}

            {

              pendingStockCount

            }{" "}

            รายการ
</p>
<p>

            ปรับ Stock รอ Sync:{" "}

            {

              pendingAdjustmentCount

            }{" "}

            รายการ
</p>
<button

            type="button"

            onClick={() => {

              retryAllPending();

            }}
>

            Sync ตอนนี้
</button>
</div>

      );

    }

    return renderPOS();

  }

  /* =========================

     Employee Stock Page

  ========================= */

  if (

    !ownerMode &&

    page ===

      "stock"

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

          setPage(

            "pos"

          )

        }

      />

    );

  }

  /* =========================

     Main

  ========================= */

  return (
<>

      {ownerMode ? (
<div className="owner-app-shell">
<OwnerSidebar

            currentPage={

              page

            }

            onChangePage={

              setPage

            }

            onLogout={

              exitOwnerMode

            }

          />
<main className="owner-app-content">

            {

              renderOwnerPage()

            }
</main>
</div>

      ) : (
<>
<div className="employee-pos-topbar">
<div className="pos-brand-status">
<strong>Dadboy POS</strong>
<SyncStatus

    isOnline={isOnline}

    cloudReady={cloudReady}

    pendingSaleCount={pendingSaleCount}

    pendingStockCount={pendingStockCount}

  />
</div>
<div className="pos-topbar-actions">
 <button

  className="top-checkout-button"

  type="button"

  onClick={openPayment}

  disabled={cart.length === 0}
>
<span className="top-checkout-icon">

    ▣
</span>
<span className="top-checkout-text">
<small>ยอดตะกร้า</small>
<strong>คิดเงิน</strong>
</span>
<span className="top-checkout-arrow">

    ›
</span>
</button>
 
<button

                className="product-menu-button"

                type="button"

                onClick={() =>

                  setLoginOpen(

                    true

                  )

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
<PaymentPopup

        open={

          paymentOpen

        }

        total={

          total

        }

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
