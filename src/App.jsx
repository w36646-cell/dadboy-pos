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

import StorageSettingsPage from "./pages/StorageSettingsPage";

import createBillId from "./utils/createBillId";

import {

  getCloudProducts,

  saveCloudProduct,

  uploadProductsToCloud,

  updateCloudStock,

  updateSoldCloudStocks,

  applyCloudStockDeltaOnce,

  setCloudStockAbsoluteOnce,

} from "./services/productService";

import {

  saveCloudSale,

  saveCloudSaleWithStock,

  getCloudTodaySales,

} from "./services/salesService";

import {

  saveStockAdjustment,

  applySelfUseOnce,

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

const PENDING_STOCK_OPS_KEY =

  "dadboy_pending_stock_ops_v1";

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

   Pending Atomic Stock Ops

========================= */

function getPendingStockOperations() {

  const result =

    readStorage(

      PENDING_STOCK_OPS_KEY,

      []

    );

  return Array.isArray(result)

    ? result

    : [];

}


function savePendingStockOperation(

  operation

) {

  if (

    !operation?.operationId

  ) {

    return false;

  }

  const current =

    getPendingStockOperations();

  const withoutOld =

    current.filter(

      (item) =>

        item.operationId !==

        operation.operationId

    );

  try {

    localStorage.setItem(

      PENDING_STOCK_OPS_KEY,

      JSON.stringify([

        ...withoutOld,

        operation,

      ])

    );

    return true;

  } catch (error) {

    console.warn(

      "Pending atomic stock operation save skipped:",

      error

    );

    return false;

  }

}


function removePendingStockOperation(

  operationId

) {

  const remaining =

    getPendingStockOperations()

      .filter(

        (item) =>

          item.operationId !==

          operationId

      );

  localStorage.setItem(

    PENDING_STOCK_OPS_KEY,

    JSON.stringify(

      remaining

    )

  );

}


function pendingStockOperationsCount() {

  return getPendingStockOperations()

    .length;

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

          sale.status !== "cancelled" &&

          sale.status !== "Cancelled" &&

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

    เปิด App / Refresh หน้า

    โหลดข้อมูลทันทีเสมอ

    ไม่สนว่าร้านเปิดหรือปิด

  */

  refreshHeaderSales();


  /*

    Auto Refresh ทุก 10 นาที

    ร้านเปิด:

    15:00 - 23:59

    ร้านปิด:

    00:00 - 14:59

    ช่วงร้านปิด

    ไม่ยิง Cloud ทุก 10 นาที

  */

  const timer =

    window.setInterval(

      () => {

        const now =

          new Date();

        const hour =

          now.getHours();


        /*

          ทำ Auto Refresh

          เฉพาะตั้งแต่ 15:00 เป็นต้นไป

        */

        if (

          hour >= 15

        ) {

          refreshHeaderSales();

        }

      },

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

    pendingStockOperationsCount() ===

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

  async function retryPendingStockOperations() {

  const operations =

    getPendingStockOperations();

  if (

    operations.length === 0

  ) {

    return true;

  }

  let allSuccess = true;

  for (

    const operation of

    operations

  ) {

    try {

      let result;

      if (

  operation.type ===

  "selfUse"

) {

  result =

    await applySelfUseOnce(

      operation.operationId,

      operation.productId,

      Number(

        operation.stockQuantity ||

        Math.abs(

          Number(operation.value || 0)

        )

      ),

      operation.note || null,

      operation.adjustedAt ||

        operation.createdAt ||

        new Date().toISOString()

    );

} else if (

  operation.type ===

  "set"

) {

  result =

    await setCloudStockAbsoluteOnce(

      operation.operationId,

      operation.productId,

      operation.value

    );

} else {

  result =

    await applyCloudStockDeltaOnce(

      operation.operationId,

      operation.productId,

      operation.value

    );

}
 
      setLocalStockValue(
result.id,

        result.stock

      );

      removePendingStockOperation(

        operation.operationId

      );

    } catch (error) {

      allSuccess = false;

      console.error(

        "Pending atomic stock sync error:",

        operation,

        error

      );

    }

  }

  notifySyncStateChanged();

  return allSuccess;

}

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

    pendingSales.length === 0

  ) {

    return true;

  }


  let allSuccess = true;


  for (

    const sale of

    pendingSales

  ) {

    try {

      /*

        บิลรุ่น Atomic ใหม่

        บันทึก:

        - บิล

        - รายการ

        - ตัด Stock

        ใน Transaction เดียว

      */

      if (

        sale.stockSyncMode ===

        "atomic"

      ) {

        const result =

          await saveCloudSaleWithStock(

            sale

          );


        /*

          Stock ที่ Database คำนวณจริง

          ต้องเป็นค่าหลักของเครื่องนี้

        */

        Object.entries(

          result.cloudStocks || {}

        ).forEach(

          ([

            productId,

            stock,

          ]) => {

            setLocalStockValue(

              productId,

              stock

            );

          }

        );

      } else {

        /*

          Pending รุ่นเก่า

          ห้ามเปลี่ยนเป็น Atomic

          เพราะ Stock รุ่นเก่า

          อาจถูกตัดไปแล้ว

        */

        await saveCloudSale(

          sale

        );

      }


      removePendingSale(

        sale.billId

      );


    } catch (error) {

      allSuccess = false;

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

   /*

  ต้องจัดลำดับ

  1. Pending Stock รุ่นเก่าให้หมดก่อน

  2. Atomic Receive / Stock Ops

  3. Sales

  4. Adjustment History

  ห้ามให้ Absolute Stock รุ่นเก่า

  ทำพร้อมกับ Atomic Stock

*/

const stockOk =

  await retryPendingStocks();


const atomicStockOk =

  stockOk

    ? await retryPendingStockOperations()

    : false;


const salesOk =

  stockOk &&

  atomicStockOk

    ? await retryPendingSales()

    : false;


const adjustmentOk =

  stockOk

    ? await retryPendingAdjustments()

    : false;


const clean =

  isSyncClean();


setCloudReady(

  stockOk &&

    atomicStockOk &&

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

function setLocalStockValue(

  productId,

  stock

) {

  const safeStock =

    Number(stock);

  if (

    !Number.isFinite(

      safeStock

    )

  ) {

    return;

  }

  setInventory(

    (current) => {

      const next = {

        ...current,

        [productId]:

          safeStock,

      };

      try {

        localStorage.setItem(

          STOCK_KEY,

          JSON.stringify(

            next

          )

        );

      } catch (error) {

        console.warn(

          "Inventory local cache skipped:",

          error

        );

      }

      return next;

    }

  );

}


function applyLocalStockDelta(

  productId,

  delta

) {

  setInventory(

    (current) => {

      const nextStock =

        Number(

          current[

            productId

          ] ?? 0

        ) +

        Number(delta || 0);

      const next = {

        ...current,

        [productId]:

          nextStock,

      };

      try {

        localStorage.setItem(

          STOCK_KEY,

          JSON.stringify(

            next

          )

        );

      } catch (error) {

        console.warn(

          "Inventory local cache skipped:",

          error

        );

      }

      return next;

    }

  );

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

    !Number.isSafeInteger(

      safeQty

    ) ||

    safeQty <= 0

  ) {

    return;

  }


  const operationId =

    `receive-${String(

      productId

    )}-${Date.now()}-${Math.random()

      .toString(36)

      .slice(2, 8)}`;


  const operation = {

    operationId,

    productId:

      String(productId),

    type: "delta",

    value:

      safeQty,

    createdAt:

      new Date()

        .toISOString(),

  };


  /*

    บันทึก Pending ก่อน

    ถ้า Cloud สำเร็จแต่ Response หาย

    operationId เดิมจะถูก Retry

    และ Database จะไม่บวกซ้ำ

  */

  const pendingSaved =

    savePendingStockOperation(

      operation

    );


  if (!pendingSaved) {

    window.alert(

      "ไม่สามารถบันทึกคิวรับสินค้าในเครื่องได้\nกรุณาลองใหม่"

    );

    return;

  }


  /*

    ให้หน้าจอเห็นจำนวนที่รับเข้า

    ทันทีแบบ Optimistic

  */

  applyLocalStockDelta(

    productId,

    safeQty

  );


  notifySyncStateChanged();


  /*

    Offline:

    เก็บ Delta ไว้

    ไม่ส่งยอดคงเหลือทั้งก้อน

  */

  if (

    typeof navigator !==

      "undefined" &&

    navigator.onLine ===

      false

  ) {

    setCloudReady(false);

    return;

  }


  applyCloudStockDeltaOnce(

    operationId,

    productId,

    safeQty

  )

    .then(

      (result) => {

        /*

          ใช้ Stock ที่ Cloud คำนวณจริง

          เป็นค่าหลัก

        */

        setLocalStockValue(
result.id,

          result.stock

        );

        removePendingStockOperation(

          operationId

        );

        notifySyncStateChanged();

        setCloudReady(

          isSyncClean()

        );

      }

    )

    .catch(

      (error) => {

        console.error(

          "Atomic receive stock error:",

          error

        );

        /*

          ห้ามลบ Pending

          เพื่อให้ Retry ด้วย operationId เดิม

        */

        setCloudReady(false);

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

    quantity = 1,

    specialMode = "normal"

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

    const normalizedSpecialMode =

      specialMode ||

      "normal";

    /*

      =========================

      กินเอง

      =========================

      - ไม่เข้า Cart

      - ไม่สร้าง Sale

      - ไม่เพิ่มยอดขาย

      - ตัด Stock

      - บันทึกใน stock_adjustments

    */

    if (

  normalizedSpecialMode ===

  "selfUse"

) {

  const stockQuantity =

    safeQty *

    stockPerUnit;


  const previousStock =

    getStock(
product.id

    );


  const optimisticStock =

    previousStock -

    stockQuantity;


  if (

    optimisticStock < 0

  ) {

    window.alert(

      `Stock ไม่พอ\nคงเหลือ ${previousStock} ชิ้น\nต้องใช้ ${stockQuantity} ชิ้น`

    );

    return;

  }


  const totalSelfUseCost =

    cost *

    stockQuantity;


  const adjustedAt =

    new Date()

      .toISOString();


  const operationId =

    `selfuse-${String(
product.id

    )}-${Date.now()}-${Math.random()

      .toString(36)

      .slice(2, 8)}`;


  const note =

    `${optionName} | ` +

    `จำนวน ${safeQty}${isPack ? " แพ็ก" : " ชิ้น"} | ` +

    `ใช้สต๊อก ${stockQuantity} ชิ้น | ` +

    `ต้นทุนรวม ${Number(

      totalSelfUseCost

    ).toFixed(2)} บาท`;


  const operation = {

    operationId,

    productId:

      String(product.id),

    type:

      "selfUse",

    /*

      เก็บเป็น Delta จริง

      กินเอง 1 ชิ้น = -1

      กินเอง 12 ชิ้น = -12

    */

    value:

      -stockQuantity,

    stockQuantity,

    note,

    adjustedAt,

    createdAt:

      adjustedAt,

  };


  /*

    ต้องบันทึก Pending ก่อน

    ถ้า Cloud สำเร็จแต่

    response กลับมาไม่ถึงเครื่อง

    เราจะ Retry operationId เดิม

    และไม่ตัดซ้ำ

  */

  const pendingSaved =

    savePendingStockOperation(

      operation

    );


  if (!pendingSaved) {

    window.alert(

      "ไม่สามารถบันทึกคิวกินเองในเครื่องได้\nกรุณาลองใหม่"

    );

    return;

  }


  /*

    หน้าจอลดทันทีแบบ Optimistic

    เป็น -delta

    ไม่ใช่เอายอดใหม่ไปทับ Cloud

  */

  applyLocalStockDelta(
product.id,

    -stockQuantity

  );


  notifySyncStateChanged();


  /*

    Offline:

    เก็บ -delta ไว้ก่อน

  */

  if (

    typeof navigator !==

      "undefined" &&

    navigator.onLine ===

      false

  ) {

    setCloudReady(false);

    window.alert(

      "บันทึกกินเองในเครื่องแล้ว\nข้อมูลจะ Sync เมื่อกลับมาออนไลน์"

    );

    return;

  }


  /*

    Online:

    Supabase จะเป็นคนอ่าน

    Stock Cloud ล่าสุดแล้ว -จำนวนเอง

  */

  applySelfUseOnce(

    operationId,
product.id,

    stockQuantity,

    note,

    adjustedAt

  )

    .then(

      (result) => {

        /*

          ใช้ยอดที่ Cloud

          คำนวณจริงกลับมา

        */

        setLocalStockValue(
result.id,

          result.stock

        );


        removePendingStockOperation(

          operationId

        );


        notifySyncStateChanged();


        setCloudReady(

          isSyncClean()

        );


        window.alert(

          "บันทึกกินเองเรียบร้อย"

        );

      }

    )

    .catch(

      (error) => {

        console.error(

          "Atomic self-use error:",

          error

        );


        /*

          ห้ามลบ Pending

          เผื่อ Cloud ทำสำเร็จแล้ว

          แต่ response หาย

        */

        setCloudReady(false);


        window.alert(

          "บันทึกกินเองในเครื่องแล้ว\nข้อมูลยังรอ Sync"

        );

      }

    );


  return;

}
 
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

              saleType &&

            (

              item.specialMode ||

              "normal"

            ) ===

              normalizedSpecialMode;

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

                    specialMode:

                      normalizedSpecialMode,

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

            specialMode:

              normalizedSpecialMode,

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

        (

          item,

          index

        ) => {

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

          const lineId =

            item.cartLineId ||

            `sale-line-${String(
item.id

            )}-${index}-${String(

              item.lastAddedAt ||

                Date.now()

            )}`;

          return {

            lineId,

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

      stockSyncMode:

        "atomic",

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

    /*

      บิล Atomic ไม่สร้าง

      Pending Stock แบบยอดคงเหลือทั้งก้อน

      Stock จะถูกตัดพร้อมบิล

      ใน Database Transaction เดียว

    */

    notifySyncStateChanged();
 
    setCart([]);

    setPaymentOpen(

      false

    );

    window.alert(

      `ขายสำเร็จ\nเลขบิล ${sale.billId}\nยอดรวม ${checkoutTotal.toLocaleString()} บาท`

    );

    /*

      Offline:

      เก็บ sale ที่มี

      stockSyncMode = atomic

      ไว้ใน Pending

      เมื่อกลับมา Online

      retryPendingSales()

      จะส่งบิล + ตัด Stock

      ใน Transaction เดียว

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

      return;

    }


    /*

      Online:

      บันทึกพร้อมกัน:

      - sales

      - sale_items

      - products.stock

      - stock_operations

      ถ้าส่วนใด Error

      Database Rollback ทั้งหมด

    */

    saveCloudSaleWithStock(

      sale

    )

      .then(

        (result) => {

          /*

            ใช้ Stock ที่ Cloud

            คำนวณจากยอดล่าสุดจริง

            ห้ามใช้ยอด Local

            เป็นค่าหลักหลัง Sync

          */

          Object.entries(

            result.cloudStocks ||

              {}

          ).forEach(

            ([

              productId,

              stock,

            ]) => {

              setLocalStockValue(

                productId,

                stock

              );

            }

          );


          removePendingSale(

            sale.billId

          );


          notifySyncStateChanged();


          /*

            บิลขึ้น Cloud แล้ว

            Refresh ยอดขายวันนี้

          */

          refreshHeaderSales();


          setCloudReady(

            isSyncClean()

          );

        }

      )

      .catch(

        (error) => {

          console.error(

            "Atomic sale sync error:",

            error

          );


          /*

            ห้ามลบ Pending Sale

            ถ้า Request สำเร็จที่ Cloud

            แต่ Response กลับมาไม่ถึงเครื่อง

            Retry billId เดิมจะไม่ตัด

            Stock ซ้ำ

          */

          setCloudReady(

            false

          );

        }

      );

}

/* =========================

   Owner Mode
 
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

      sale.status !== "Cancelled" &&

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
<StorageSettingsPage

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

          pendingAdjustmentCount={

            pendingAdjustmentCount

          }

          onSync={

            retryAllPending

          }

        />

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
