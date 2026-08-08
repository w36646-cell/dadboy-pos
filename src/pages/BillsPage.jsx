import {

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  deleteCloudSale,

  getCloudSales,

} from "../services/salesService";

import {

  restoreCloudStocksFromItems,

} from "../services/productService";

import "./BillsPage.css";

const SALES_KEY =

  "dadboy_sales_v1";

const STOCK_KEY =

  "dadboy_inventory_v2";

const PENDING_SALES_KEY =

  "dadboy_pending_sales_sync_v2";

const PENDING_STOCK_KEY =

  "dadboy_pending_stock_sync_v2";

function readStorage(

  key,

  fallback

) {

  try {

    const saved =

      localStorage.getItem(key);

    return saved

      ? JSON.parse(saved)

      : fallback;

  } catch {

    return fallback;

  }

}

function writeStorage(

  key,

  value

) {

  localStorage.setItem(

    key,

    JSON.stringify(value)

  );

}

function getPendingSales() {

  const result =

    readStorage(

      PENDING_SALES_KEY,

      []

    );

  return Array.isArray(result)

    ? result

    : [];

}

function removePendingSale(

  billId

) {

  const current =

    getPendingSales();

  const remaining =

    current.filter(

      (sale) =>

        sale.billId !== billId

    );

  writeStorage(

    PENDING_SALES_KEY,

    remaining

  );

}

function getPendingStocks() {

  const result =

    readStorage(

      PENDING_STOCK_KEY,

      {}

    );

  if (

    result &&

    typeof result === "object" &&

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

  writeStorage(

    PENDING_STOCK_KEY,

    {

      ...current,

      [String(productId)]:

        Number(stock),

    }

  );

}

function removePendingStock(

  productId

) {

  const current =

    getPendingStocks();

  delete current[

    String(productId)

  ];

  writeStorage(

    PENDING_STOCK_KEY,

    current

  );

}

function mergeSales(

  cloudSales,

  localSales

) {

  const result =

    new Map();

  (localSales || []).forEach(

    (sale) => {

      if (!sale?.billId) {

        return;

      }

      result.set(

        sale.billId,

        sale

      );

    }

  );

  (cloudSales || []).forEach(

    (sale) => {

      if (!sale?.billId) {

        return;

      }

      const localSale =

        result.get(

          sale.billId

        );

      result.set(

        sale.billId,

        {

          ...localSale,

          ...sale,

          items:

            Array.isArray(

              sale.items

            ) &&

            sale.items.length > 0

              ? sale.items

              : localSale?.items ||

                [],

        }

      );

    }

  );

  return Array.from(

    result.values()

  );

}

function restoreLocalStock(

  sale

) {

  const inventory =

    readStorage(

      STOCK_KEY,

      {}

    );

  const updatedInventory = {

    ...inventory,

  };

  (sale.items || []).forEach(

    (item) => {

      const productId =

        item.productId;

      const quantity =

        Number(

          item.quantity || 0

        );

      if (

        productId ===

          undefined ||

        productId === null

      ) {

        return;

      }

      updatedInventory[

        productId

      ] =

        Number(

          updatedInventory[

            productId

          ] ?? 0

        ) +

        quantity;

    }

  );

  writeStorage(

    STOCK_KEY,

    updatedInventory

  );

  return updatedInventory;

}

function removeLocalBill(

  sales,

  billId

) {

  const updatedSales =

    sales.filter(

      (item) =>

        item.billId !== billId

    );

  writeStorage(

    SALES_KEY,

    updatedSales

  );

  return updatedSales;

}

function BillsPage({

  onInventoryUpdated,

}) {

  const [

    sales,

    setSales,

  ] = useState(() =>

    readStorage(

      SALES_KEY,

      []

    )

  );

  const [

    selectedBill,

    setSelectedBill,

  ] = useState(null);

  const [

    searchText,

    setSearchText,

  ] = useState("");

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    cloudError,

    setCloudError,

  ] = useState(false);

  const [

    cancelling,

    setCancelling,

  ] = useState(false);

  const [

    isOnline,

    setIsOnline,

  ] = useState(() =>

    typeof navigator ===

    "undefined"

      ? true

      : navigator.onLine

  );

  function updateAppInventory(

    newInventory

  ) {

    if (

      typeof onInventoryUpdated ===

      "function"

    ) {

      onInventoryUpdated(

        newInventory

      );

    }

  }

  useEffect(() => {

    let cancelled =

      false;

    async function loadBills() {

      setLoading(true);

      const localSales =

        readStorage(

          SALES_KEY,

          []

        );

      if (

        typeof navigator !==

          "undefined" &&

        navigator.onLine === false

      ) {

        if (!cancelled) {

          setSales(

            localSales

          );

          setCloudError(true);

          setLoading(false);

        }

        return;

      }

      try {

        const cloudSales =

          await getCloudSales();

        if (cancelled) {

          return;

        }

        const mergedSales =

          mergeSales(

            cloudSales,

            localSales

          );

        setSales(

          mergedSales

        );

        writeStorage(

          SALES_KEY,

          mergedSales

        );

        setCloudError(false);

      } catch (error) {

        console.error(

          "Supabase load bills error:",

          error

        );

        if (cancelled) {

          return;

        }

        setSales(

          localSales

        );

        setCloudError(true);

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    function handleOnline() {

      setIsOnline(true);

      loadBills();

    }

    function handleOffline() {

      setIsOnline(false);

      setCloudError(true);

    }

    loadBills();

    window.addEventListener(

      "online",

      handleOnline

    );

    window.addEventListener(

      "offline",

      handleOffline

    );

    return () => {

      cancelled = true;

      window.removeEventListener(

        "online",

        handleOnline

      );

      window.removeEventListener(

        "offline",

        handleOffline

      );

    };

  }, []);

  const filteredSales =

    useMemo(() => {

      const keyword =

        searchText

          .trim()

          .toLowerCase();

      const result =

        [...sales].sort(

          (a, b) =>

            new Date(

              b.soldAt

            ) -

            new Date(

              a.soldAt

            )

        );

      if (!keyword) {

        return result;

      }

      return result.filter(

        (sale) => {

          const billId =

            String(

              sale.billId || ""

            ).toLowerCase();

          const date =

            String(

              sale.soldDate || ""

            ).toLowerCase();

          const productNames =

            sale.items

              ?.map(

                (item) =>

                  item.productName

              )

              .join(" ")

              .toLowerCase() ||

            "";

          return (

            billId.includes(

              keyword

            ) ||

            date.includes(

              keyword

            ) ||

            productNames.includes(

              keyword

            )

          );

        }

      );

    }, [

      sales,

      searchText,

    ]);

  async function cancelBill(

    sale

  ) {

    if (

      !sale ||

      cancelling

    ) {

      return;

    }

    if (
sale.id &&

      !isOnline

    ) {

      window.alert(

        "บิลนี้บันทึกอยู่บน Cloud แล้ว\nกรุณาเชื่อมต่ออินเทอร์เน็ตก่อนยกเลิกบิล"

      );

      return;

    }

    const confirmed =

      window.confirm(

        `ยกเลิกบิล ${sale.billId} ใช่หรือไม่?\nสต๊อกสินค้าจะถูกคืนกลับ`

      );

    if (!confirmed) {

      return;

    }

    setCancelling(true);

    try {

      /*

        ==================================

        บิลที่อยู่บน Cloud

        ==================================

      */

      if (sale.id) {

        const restoredStocks =

          await restoreCloudStocksFromItems(

            sale.items || []

          );

        const localInventory =

          readStorage(

            STOCK_KEY,

            {}

          );

        const updatedInventory = {

          ...localInventory,

          ...restoredStocks,

        };

        /*

          เขียน LocalStorage

        */

        writeStorage(

          STOCK_KEY,

          updatedInventory

        );

        /*

          สำคัญ:

          อัปเดต React inventory

          ที่ App.jsx ด้วย

        */

        updateAppInventory(

          updatedInventory

        );

        /*

          Stock ชุดนี้ขึ้น Cloud แล้ว

          ไม่ต้องค้าง Pending

        */

        Object.keys(

          restoredStocks || {}

        ).forEach(

          (productId) => {

            removePendingStock(

              productId

            );

          }

        );

        /*

          ลบ sale_items + sales

        */

        await deleteCloudSale(
sale.id

        );

        removePendingSale(

          sale.billId

        );

        const updatedSales =

          removeLocalBill(

            sales,

            sale.billId

          );

        setSales(

          updatedSales

        );

        setSelectedBill(null);

        window.alert(

          "ยกเลิกบิลเรียบร้อย\nคืนสต๊อกทั้ง POS และ Cloud แล้ว"

        );

        return;

      }

      /*

        ==================================

        บิล Local ที่ยังไม่ขึ้น Cloud

        ==================================

      */

      const updatedInventory =

        restoreLocalStock(

          sale

        );

      /*

        อัปเดตหน้า POS ทันที

      */

      updateAppInventory(

        updatedInventory

      );

      /*

        บิลนี้ถูกยกเลิกแล้ว

        ห้าม Sync ขึ้น Cloud

      */

      removePendingSale(

        sale.billId

      );

      /*

        Stock ที่คืนต้องรอ Sync

        ไป Cloud ภายหลัง

      */

      (sale.items || []).forEach(

        (item) => {

          const productId =

            item.productId;

          if (

            productId ===

              undefined ||

            productId === null

          ) {

            return;

          }

          savePendingStock(

            productId,

            updatedInventory[

              productId

            ]

          );

        }

      );

      const updatedSales =

        removeLocalBill(

          sales,

          sale.billId

        );

      setSales(

        updatedSales

      );

      setSelectedBill(null);

      if (isOnline) {

        window.alert(

          "ยกเลิกบิลและคืนสต๊อกใน POS เรียบร้อย\nStock จะ Sync ขึ้น Cloud อัตโนมัติ"

        );

      } else {

        window.alert(

          "ยกเลิกบิลและคืนสต๊อกใน POS เรียบร้อย\nเมื่ออินเทอร์เน็ตกลับมา Stock จะ Sync ขึ้น Cloud"

        );

      }

    } catch (error) {

      console.error(

        "Cancel bill error:",

        error

      );

      window.alert(

        "ยกเลิกบิลไม่สำเร็จ\nกรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่"

      );

    } finally {

      setCancelling(false);

    }

  }

  return (
<div className="bills-page">
<header className="bills-header">
<div>
<h1>

            บิลย้อนหลัง
</h1>
<p>

            ดูรายละเอียดและยกเลิกบิลขาย
</p>
</div>
<div

          style={{

            padding:

              "7px 11px",

            borderRadius:

              "999px",

            fontSize:

              "12px",

            fontWeight:

              700,

            background:

              isOnline

                ? "#ecfdf3"

                : "#fff7ed",

            color:

              isOnline

                ? "#067647"

                : "#9a3412",

            border:

              isOnline

                ? "1px solid #abefc6"

                : "1px solid #fed7aa",

          }}
>

          {isOnline

            ? "● ออนไลน์"

            : "● ออฟไลน์"}
</div>
</header>

      {cloudError && (
<div

          style={{

            marginBottom:

              "12px",

            padding:

              "10px 14px",

            borderRadius:

              "10px",

            background:

              "#fff3cd",

            color:

              "#664d03",

            fontSize:

              "13px",

          }}
>

          {isOnline

            ? "Cloud เชื่อมต่อไม่สำเร็จ ตอนนี้กำลังแสดงบิลสำรองจากเครื่อง"

            : "กำลังใช้งานแบบ Offline แสดงบิลที่เก็บอยู่ในเครื่อง"}
</div>

      )}
<div className="bills-toolbar">
<input

          type="search"

          placeholder="ค้นหาเลขบิล วันที่ หรือสินค้า..."

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
<div className="bills-count">

          {loading

            ? "กำลังโหลด..."

            : `${filteredSales.length} บิล`}
</div>
</div>
<div className="bills-layout">
<section className="bills-list-box">

          {loading ? (
<div className="bills-empty">

              กำลังโหลดบิล...
</div>

          ) : filteredSales.length ===

            0 ? (
<div className="bills-empty">

              ยังไม่มีบิลขาย
</div>

          ) : (

            filteredSales.map(

              (sale) => (
<button

                  type="button"

                  className={

                    selectedBill?.billId ===

                    sale.billId

                      ? "bill-row active"

                      : "bill-row"

                  }

                  key={

                    sale.billId

                  }

                  onClick={() =>

                    setSelectedBill(

                      sale

                    )

                  }
>
<div className="bill-row-main">
<strong>

                      {

                        sale.billId

                      }
</strong>
<span>

                      {

                        sale.soldDate

                      }{" "}

                      {

                        sale.soldTime

                      }
</span>
</div>
<div className="bill-row-value">
<strong>

                      {Number(

                        sale.totalAmount ||

                          0

                      ).toLocaleString()}{" "}

                      บาท
</strong>
<span>

                      {

                        sale.totalQty

                      }{" "}

                      ชิ้น
</span>
</div>
</button>

              )

            )

          )}
</section>
<section className="bill-detail-box">

          {!selectedBill ? (
<div className="bills-empty">

              เลือกบิลเพื่อดูรายละเอียด
</div>

          ) : (
<>
<div className="bill-detail-header">
<div>
<h2>

                    {

                      selectedBill.billId

                    }
</h2>
<p>

                    {

                      selectedBill.soldDate

                    }{" "}

                    {

                      selectedBill.soldTime

                    }
</p>
</div>
<button

                  type="button"

                  className="bill-cancel-button"

                  disabled={

                    cancelling

                  }

                  onClick={() =>

                    cancelBill(

                      selectedBill

                    )

                  }
>

                  {cancelling

                    ? "กำลังยกเลิก..."

                    : "ยกเลิกบิล"}
</button>
</div>

              {selectedBill.id &&

                !isOnline && (
<div

                    style={{

                      marginBottom:

                        "12px",

                      padding:

                        "8px 10px",

                      borderRadius:

                        "8px",

                      background:

                        "#fff7ed",

                      color:

                        "#9a3412",

                      fontSize:

                        "12px",

                    }}
>

                    บิลนี้อยู่บน Cloud แล้ว ต้องออนไลน์ก่อนจึงจะยกเลิกได้
</div>

                )}
<div className="bill-detail-summary">
<div>
<span>

                    ยอดขาย
</span>
<strong>

                    {Number(

                      selectedBill.totalAmount ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
<div>
<span>

                    ต้นทุน
</span>
<strong>

                    {Number(

                      selectedBill.totalCost ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
<div>
<span>

                    กำไร
</span>
<strong>

                    {Number(

                      selectedBill.totalProfit ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
</div>
<div className="bill-items">

                {selectedBill.items

                  ?.length > 0 ? (

                  selectedBill.items.map(

                    (

                      item,

                      index

                    ) => (
<div

                        className="bill-item"

                        key={`${item.productId}-${item.option}-${index}`}
>
<div>
<strong>

                            {

                              item.productName

                            }
</strong>
<span>

                            {

                              item.option

                            }
</span>
</div>
<div className="bill-item-right">
<span>

                            {

                              item.quantity

                            }{" "}

                            ×{" "}

                            {

                              item.unitPrice

                            }
</span>
<strong>

                            {Number(

                              item.lineTotal ||

                                0

                            ).toLocaleString()}{" "}

                            บาท
</strong>
</div>
</div>

                    )

                  )

                ) : (
<div className="bills-empty">

                    ไม่มีรายละเอียดสินค้าในบิลนี้
</div>

                )}
</div>
</>

          )}
</section>
</div>
</div>

  );

}

export default BillsPage;